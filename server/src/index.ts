// @ts-nocheck
import { sanitizeRequest } from './lib/security/sanitizeInput';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler.middleware';
import { getJwtSecret } from './lib/jwtSecret';
import { RedisRateLimitStore } from './lib/redisRateLimitStore';
import { requireHttps, hstsOptions, createTlsServer, databaseTransportWarning } from './lib/transportSecurity';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY environment variable is required!');
  console.error('   Please set OPENAI_API_KEY in your .env file.');
  console.error('   See .env.example for reference.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  try {
    getJwtSecret();
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
  try {
    require('./lib/fieldCrypto').assertFieldEncryptionConfigured();
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
  if (!(process.env.KYC_ENCRYPTION_KEY || '').trim()) {
    console.error('❌ ERROR: KYC_ENCRYPTION_KEY is required in production.');
    process.exit(1);
  }
}

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(requireHttps);
app.use(helmet({
  hsts: hstsOptions,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'self'", "http://localhost:5000", "http://localhost:5173", "http://localhost:3000", "https://ai-dpr.up.railway.app"],
      "frame-src": ["'self'", "http://localhost:5000", "https://dpr-server.up.railway.app", "blob:", "data:"],
    },
  },
})); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev')); // Logging
// Increase payload limits to support HTML+CSS capture for exact PDF generation
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Strip Mongo operators, prototype keys, control characters and script markup from every request.
app.use(sanitizeRequest);

// No public file tree. KYC and cluster photos are served only via authenticated APIs.
app.use('/uploads', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// API documentation (OpenAPI 3.0.3). Generated from the route files: `npm run docs:openapi`.
// Off in production unless ENABLE_API_DOCS=true, so the list of endpoints is not handed to the public.
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true') {
  try {
    const swaggerUi = require('swagger-ui-express');
    const fs = require('fs');
    const path = require('path');
    const spec = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'openapi.json'), 'utf8'));
    app.get('/api/openapi.json', (_req, res) => res.json(spec));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'MSME AI DPR API' }));
  } catch (error: any) {
    console.warn('⚠️  API docs not available:', error.message);
  }
}

// Rate limiting
const limiter = rateLimit({
  // Shared across servers when REDIS_URL is set; otherwise counted in this server's memory.
  store: process.env.REDIS_URL ? new RedisRateLimitStore() : undefined,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Session refreshes happen about once a minute while someone is working; they must never be throttled.
  skip: (req) => req.path === '/auth/refresh',
});
app.use('/api', limiter);

// Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MSME AI DPR Generation Tool API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Seed initial schemes (optional)
    await seedSchemes();
    // Test accounts with a published password: never created in production unless explicitly asked for.
    if (process.env.NODE_ENV !== 'production' || process.env.SEED_TEST_USERS === 'true') await seedRbacUsers();

    // Pre-warm RAG assistant cache (eliminates 5-10s overhead on first request)
    const { preWarmAssistantCache } = await import('./services/openai.service');
    preWarmAssistantCache().catch(err => {
      console.warn('⚠️  Assistant pre-warming failed (non-critical):', err.message);
    });

    // Start listening
    const dbWarning = databaseTransportWarning(process.env.MONGODB_URI);
    if (dbWarning) console.warn(`⚠️  ${dbWarning}`);
    const tlsServer = createTlsServer(app);
    if (!tlsServer && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  No TLS_CERT_FILE/TLS_KEY_FILE: TLS 1.3 must be enforced by the proxy in front of this server.');
    }
    (tlsServer || app).listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`💚 Health check at http://localhost:${PORT}/api/health\n`);
    });

    const { runRetentionJob } = await import('./services/retention.service');
    const runRetention = () => {
      runRetentionJob()
        .then((summary) => {
          if (summary.warned || summary.purged || summary.auditPurged) {
            console.info(
              `[retention] warned=${summary.warned} purged=${summary.purged} auditPurged=${summary.auditPurged} idleDays=${summary.idleDays} auditDays=${summary.auditDays}`
            );
          }
        })
        .catch((err) => console.error('[retention] job failed:', err.message));
    };
    const { runEscalation } = await import('./services/supportEscalation.service');
    setInterval(() => runEscalation().catch((err) => console.error('[support] escalation failed:', err.message)), 60_000);
    setTimeout(runRetention, 20_000);
    setInterval(runRetention, 6 * 60 * 60 * 1000);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Seed initial government schemes
async function seedSchemes() {
  const { Scheme } = await import('./models/Scheme.model');
  
  const schemeCount = await Scheme.countDocuments();
  if (schemeCount === 0) {
    console.log('Seeding initial schemes...');
    
    const schemes = [
      {
        schemeCode: 'PMEGP',
        schemeName: 'Prime Minister Employment Generation Programme',
        nameInTelugu: 'ప్రధానమంత్రి ఉపాధి ఉత్పత్తి కార్యక్రమం',
        description: 'PMEGP is a credit-linked subsidy programme for setting up new self-employment ventures/projects/micro enterprises.',
        descriptionInTelugu: 'PMEGP కొత్త స్వయం ఉపాధి వ్యాపారాలు/ప్రాజెక్టులు/మైక్రో ఎంటర్‌ప్రైజెస్ స్థాపించడానికి క్రెడిట్-లింక్డ్ సబ్సిడీ కార్యక్రమం.',
        eligibilityCriteria: {
          minAge: 18,
          maxAge: 65,
          minCost: 100000,
          maxCost: 5000000,
          applicableFor: ['manufacturing', 'service', 'trading'],
          category: ['micro', 'small'],
        },
        benefits: {
          subsidyPercentage: 25,
          maxSubsidyAmount: 250000,
          marginMoney: 10,
        },
      },
      {
        schemeCode: 'MUDRA',
        schemeName: 'Pradhan Mantri MUDRA Yojana',
        nameInTelugu: 'ప్రధానమంత్రి ముద్ర యోజన',
        description: 'MUDRA provides funding to non-corporate small business sector through various financial institutions.',
        descriptionInTelugu: 'ముద్ర వివిధ ఆర్థిక సంస్థల ద్వారా కార్పొరేట్-యేతర చిన్న వ్యాపార రంగానికి నిధులు అందిస్తుంది.',
        eligibilityCriteria: {
          minCost: 50000,
          maxCost: 1000000,
          applicableFor: ['manufacturing', 'service', 'trading', 'agriculture'],
          category: ['micro'],
        },
        benefits: {
          interestRate: 10,
          marginMoney: 0,
        },
      },
      {
        schemeCode: 'CGTMSE',
        schemeName: 'Credit Guarantee Fund Trust for Micro and Small Enterprises',
        nameInTelugu: 'మైక్రో మరియు స్మాల్ ఎంటర్‌ప్రైజెస్ కోసం క్రెడిట్ గ్యారెంటీ ఫండ్ ట్రస్ట్',
        description: 'CGTMSE provides guarantee coverage for collateral-free credit to MSMEs.',
        descriptionInTelugu: 'CGTMSE MSMEలకు కొలేటరల్-రహిత క్రెడిట్ కోసం గ్యారెంటీ కవరేజ్ అందిస్తుంది.',
        eligibilityCriteria: {
          maxCost: 20000000,
          applicableFor: ['manufacturing', 'service'],
          category: ['micro', 'small'],
        },
        benefits: {
          subsidyPercentage: 0,
        },
      },
      {
        schemeCode: 'MSME-CDP',
        schemeName: 'MSME Cluster Development Programme',
        nameInTelugu: 'MSME క్లస్టర్ డెవలప్‌మెంట్ ప్రోగ్రామ్',
        description: 'CDP aims to support the sustainability and growth of MSMEs by addressing common issues.',
        descriptionInTelugu: 'CDP సాధారణ సమస్యలను పరిష్కరించడం ద్వారా MSMEల స్థిరత్వం మరియు వృద్ధికి మద్దతు ఇవ్వడం లక్ష్యంగా పెట్టుకుంది.',
        eligibilityCriteria: {
          minCost: 500000,
          applicableFor: ['manufacturing', 'service'],
          category: ['micro', 'small', 'medium'],
        },
        benefits: {
          subsidyPercentage: 30,
        },
      },
    ];

    await Scheme.insertMany(schemes);
    console.log('✅ Initial schemes seeded successfully');
  }

  await Scheme.deleteMany({ schemeCode: 'STANDUP' });
}

async function seedRbacUsers() {
  const { User } = await import('./models/User.model');
  const { PRIVACY_NOTICE_VERSION } = await import('./lib/privacyNotice');
  const password = 'Rbac-Test-2026';
  const accounts = [
    { name: 'RBAC Admin', email: 'rbac.admin@msme.test', role: 'admin' },
    { name: 'RBAC Consultant', email: 'rbac.consultant@msme.test', role: 'entrepreneur' },
    { name: 'RBAC Officer', email: 'rbac.officer@msme.test', role: 'officer' },
  ];
  for (const account of accounts) {
    const existing = await User.findOne({ email: account.email });
    if (existing) continue;
    await User.create({
      ...account,
      passwordHash: password,
      privacy: {
        noticeVersion: PRIVACY_NOTICE_VERSION,
        noticeAcceptedAt: new Date(),
        accountConsent: true,
        accountConsentAt: new Date(),
        aiAssist: true,
        aiAssistAt: new Date(),
      },
    });
    console.log(`✅ RBAC test login: ${account.email} / ${password} (${account.role})`);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;


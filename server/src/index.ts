// @ts-nocheck
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler.middleware';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY environment variable is required!');
  console.error('   Please set OPENAI_API_KEY in your .env file.');
  console.error('   See .env.example for reference.');
  process.exit(1);
}

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": ["'self'", "http://localhost:5000", "http://localhost:5173", "http://localhost:3000"],
      "frame-src": ["'self'", "http://localhost:5000", "blob:", "data:"],
    },
  },
})); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically with explicit CORS headers
app.use('/uploads', (req, res, next) => {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  // Allow embedding for PDFs and images
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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

    // Pre-warm RAG assistant cache (eliminates 5-10s overhead on first request)
    const { preWarmAssistantCache } = await import('./services/openai.service');
    preWarmAssistantCache().catch(err => {
      console.warn('⚠️  Assistant pre-warming failed (non-critical):', err.message);
    });

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`💚 Health check at http://localhost:${PORT}/api/health\n`);
    });
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
        schemeCode: 'STANDUP',
        schemeName: 'Stand-Up India Scheme',
        nameInTelugu: 'స్టాండ్-అప్ ఇండియా స్కీం',
        description: 'Stand-Up India facilitates bank loans for SC/ST and women entrepreneurs.',
        descriptionInTelugu: 'స్టాండ్-అప్ ఇండియా SC/ST మరియు మహిళా వ్యవసాయులకు బ్యాంక్ రుణాలను సులభతరం చేస్తుంది.',
        eligibilityCriteria: {
          minCost: 1000000,
          maxCost: 10000000,
          applicableFor: ['manufacturing', 'service', 'trading'],
          category: ['micro', 'small'],
        },
        benefits: {
          interestRate: 9,
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


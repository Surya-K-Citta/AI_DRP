// @ts-nocheck
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database';
import routes from '../src/routes';
import { errorHandler, notFound } from '../src/middleware/errorHandler.middleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Connect to database (for serverless, connection is reused)
let dbConnected = false;
const ensureDbConnection = async () => {
  if (!dbConnected) {
    try {
      await connectDatabase();
      dbConnected = true;
    } catch (error) {
      console.error('Database connection error:', error);
    }
  }
};

// Initialize database connection on cold start
ensureDbConnection().catch(console.error);

// Export the Express app as a serverless function
export default app;


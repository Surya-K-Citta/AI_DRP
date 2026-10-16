// @ts-nocheck
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

// Timeouts for production (Railway/Atlas cross-region can be slow)
const CONNECT_TIMEOUT_MS = 60000;
const SERVER_SELECTION_TIMEOUT_MS = 60000;
const SOCKET_TIMEOUT_MS = 45000;

const TIMEOUT_PARAMS = `connectTimeoutMS=${CONNECT_TIMEOUT_MS}&serverSelectionTimeoutMS=${SERVER_SELECTION_TIMEOUT_MS}&socketTimeoutMS=${SOCKET_TIMEOUT_MS}`;

function uriWithTimeoutOptions(uri: string): string {
  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}${TIMEOUT_PARAMS}`;
}

export const connectDatabase = async (): Promise<void> => {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required. Please set it in your .env file.');
  }

  uri = uriWithTimeoutOptions(uri);

  const options = {
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
    socketTimeoutMS: SOCKET_TIMEOUT_MS,
    // Connection pool: every API server keeps up to maxPoolSize connections open and reuses them across requests.
    maxPoolSize: Math.max(1, parseInt(process.env.MONGODB_MAX_POOL_SIZE || '20', 10)),
    minPoolSize: Math.max(0, parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10)),
    maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_MS || '60000', 10),
    waitQueueTimeoutMS: parseInt(process.env.MONGODB_WAIT_QUEUE_MS || '10000', 10),
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, options);
      console.log('✅ MongoDB connected successfully');
      break;
    } catch (error: any) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);
      if (attempt === MAX_RETRIES) {
        console.error('❌ MongoDB connection failed after retries:', error);
        process.exit(1);
      }
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    const rawUri = process.env.MONGODB_URI;
    if (rawUri) {
      console.log('Attempting MongoDB reconnect...');
      mongoose.connect(uriWithTimeoutOptions(rawUri), options).catch((err: Error) => {
        console.error('MongoDB reconnect failed:', err.message);
      });
    }
  });
};


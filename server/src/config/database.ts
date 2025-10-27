import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log("MONGODB_URI",  process.env.MONGODB_URI);
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bandarin29:%40Naveen2611@creation-dpr.vhweeva.mongodb.net/';
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};


const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || (await createMemoryMongoUri());
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const createMemoryMongoUri = async () => {
  memoryServer = await MongoMemoryServer.create();
  return memoryServer.getUri();
};

module.exports = connectDB;

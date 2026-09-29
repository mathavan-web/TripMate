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
    console.warn(
      `Primary MongoDB connection failed: ${error.message}. Falling back to local in-memory MongoDB...`
    );

    try {
      const fallbackUri = await createMemoryMongoUri();
      const conn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
      });

      console.log(`MongoDB connected via fallback memory server: ${conn.connection.host}`);
      return conn;
    } catch (fallbackError) {
      console.error('MongoDB connection failed:', fallbackError.message);
      process.exit(1);
    }
  }
};

const createMemoryMongoUri = async () => {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  return memoryServer.getUri();
};

const stopMemoryMongo = async () => {
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = connectDB;
module.exports.createMemoryMongoUri = createMemoryMongoUri;
module.exports.stopMemoryMongo = stopMemoryMongo;

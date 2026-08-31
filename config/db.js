const mongoose = require("mongoose");

let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Connection is already being established
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      family: 4,
    })
    .then(() => {
      cachedConnection = mongoose.connection;
      console.log("MongoDB connected successfully");
      return cachedConnection;
    })
    .catch((error) => {
      connectionPromise = null;
      cachedConnection = null;

      console.error("MongoDB connection failed:", error.message);

      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
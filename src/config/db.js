const mongoose = require("mongoose");

const connectDB = async () => {
  // Reuse cached connection promise for serverless warm instances
  if (global._mongooseConn) {
    return global._mongooseConn;
  }

  const connectionPromise = mongoose
    .connect(process.env.MONGODB_URI)
    .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    });

  global._mongooseConn = connectionPromise;

  try {
    return await connectionPromise;
  } catch (error) {
    // Never cache a failed connection — clear so the next request can retry
    global._mongooseConn = null;
    console.error(`Error: ${error.message}`);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = connectDB;

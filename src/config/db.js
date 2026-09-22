const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Cache connection globally for serverless reuse
    if (global._mongooseConn) {
      return global._mongooseConn;
    }

    global._mongooseConn = mongoose.connect(process.env.MONGODB_URI);
    const conn = await global._mongooseConn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = connectDB;

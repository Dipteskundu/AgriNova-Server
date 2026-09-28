const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Connect to MongoDB (retries in the background, never crashes the server)
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const db = dbStates[mongoose.connection.readyState] || "unknown";
  res.json({
    status: "ok",
    db,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/farmer", require("./modules/farmer/farmer.routes"));
app.use("/api/farms", require("./modules/farms/farms.routes"));
app.use("/api/fields", require("./modules/fields/fields.routes"));
app.use("/api/crop-batches", require("./modules/crop-batches/crop-batches.routes"));
app.use("/api/crop-logs", require("./modules/crop-logs/crop-logs.routes"));
app.use("/api/calendar", require("./modules/calendar/calendar.routes"));
app.use("/api/harvests", require("./modules/harvests/harvests.routes"));
app.use("/api/expenses", require("./modules/expenses/expenses.routes"));
app.use("/api/notifications", require("./modules/notifications/notifications.routes"));
app.use("/api/training", require("./modules/training/training.routes"));
app.use("/api/admin", require("./modules/admin/admin.routes"));

// Error handling middleware
app.use(errorHandler);

module.exports = app;

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Connect to MongoDB (retries in the background, never crashes the server)
connectDB();

// Produce photos uploaded via POST /api/marketplace/upload land in `uploads/`
// (multer's relative destination, so it resolves against the process cwd).
// Create it on boot: a missing directory makes multer fail with ENOENT on the
// very first upload. Served from this origin so `<img src>` can use the
// absolute URL the upload route returns.
const uploadDir = path.join(process.cwd(), "uploads");
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  // Serverless runtimes (Vercel) mount a read-only filesystem: there is no
  // local `uploads/` to create because uploads go to Cloudinary instead.
  // Never let a missing directory take the whole app down at import time.
  console.warn(`uploads/ unavailable (${err.message}); local photo storage disabled.`);
}
app.use("/uploads", express.static(uploadDir));

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
app.use("/api/marketplace", require("./modules/marketplace/marketplace.routes"));
// The demand board's reads are public (`/marketplace/demands` has no
// RouteGuard); optionalAuth attaches a caller when a token is present so
// `?mine=1` can still resolve, and never rejects. Writes re-check via `auth`.
app.use(
  "/api/demands",
  require("./middleware/optionalAuth.middleware"),
  require("./modules/demands/demands.routes")
);
app.use("/api/orders", require("./modules/orders/orders.routes"));
app.use("/api/payments", require("./modules/payments/payments.routes"));
app.use("/api/wallet", require("./modules/wallet/wallet.routes"));
app.use("/api/deliveries", require("./modules/deliveries/deliveries.routes"));
app.use("/api/products", require("./modules/products/products.routes"));
app.use("/api/quality", require("./modules/quality/quality.routes"));

// Error handling middleware
app.use(errorHandler);

module.exports = app;

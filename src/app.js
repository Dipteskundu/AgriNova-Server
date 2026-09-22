const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Connect to MongoDB (cached globally for serverless)
connectDB();

// CORS - support multiple origins via comma-separated CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body parsing with size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Logging - skip in production for serverless
if (process.env.NODE_ENV !== "production") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", require("./modules/auth/auth.routes"));
// app.use("/api/users", require("./modules/users/users.routes"));
// app.use("/api/farms", require("./modules/farms/farms.routes"));
// app.use("/api/fields", require("./modules/fields/fields.routes"));
// app.use("/api/crops", require("./modules/crops/crops.routes"));
// app.use("/api/crop-cycles", require("./modules/crop-cycles/crop-cycles.routes"));
// app.use("/api/harvest", require("./modules/harvest/harvest.routes"));
// app.use("/api/quality", require("./modules/quality/quality.routes"));
// app.use("/api/marketplace", require("./modules/marketplace/marketplace.routes"));
// app.use("/api/demands", require("./modules/demands/demands.routes"));
// app.use("/api/orders", require("./modules/orders/orders.routes"));
// app.use("/api/payments", require("./modules/payments/payments.routes"));
// app.use("/api/deliveries", require("./modules/deliveries/deliveries.routes"));
// app.use("/api/expenses", require("./modules/expenses/expenses.routes"));
// app.use("/api/weather", require("./modules/weather/weather.routes"));
// app.use("/api/ai-assistant", require("./modules/ai-assistant/ai-assistant.routes"));
// app.use("/api/admin", require("./modules/admin/admin.routes"));

// Error handling middleware
app.use(errorHandler);

module.exports = app;

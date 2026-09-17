const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes will be imported here
// app.use("/api/auth", require("./modules/auth/auth.routes"));
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

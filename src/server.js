require("dotenv").config();
const app = require("./app");

// DB connect + auto-seed run in app.js bootstrap (serverless-safe, cached).
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

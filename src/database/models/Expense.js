// Placeholder for expense model
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm",
    },
    cropCycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropCycle",
    },
    category: {
      type: String,
      enum: ["seeds", "fertilizer", "pesticide", "labor", "irrigation", "tools", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);

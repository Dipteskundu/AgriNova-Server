const mongoose = require("mongoose");

const qualityRequestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    harvest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Harvest",
      required: true,
    },
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    inspectionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "inspecting", "completed"],
      default: "pending",
    },
    grade: {
      type: String,
      enum: ["A+", "A", "B+", "B", "C"],
    },
    report: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QualityRequest", qualityRequestSchema);

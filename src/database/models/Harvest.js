const mongoose = require("mongoose");

const harvestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cropCycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropCycle",
      required: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, "Please add quantity"],
    },
    unit: {
      type: String,
      default: "kg",
    },
    harvestDate: {
      type: Date,
      default: Date.now,
    },
    qualityGrade: {
      type: String,
      enum: ["A+", "A", "B+", "B", "C"],
    },
    pricePerUnit: {
      type: Number,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isListed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["harvested", "verified", "listed", "sold"],
      default: "harvested",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Harvest", harvestSchema);

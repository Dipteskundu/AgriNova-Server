const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add crop name"],
      trim: true,
    },
    scientificName: {
      type: String,
    },
    category: {
      type: String,
      enum: ["cereal", "vegetable", "fruit", "pulse", "oilseed", "fiber", "spice"],
      required: true,
    },
    growingSeason: [
      {
        type: String,
        enum: ["spring", "summer", "autumn", "winter"],
      },
    ],
    growthDuration: {
      type: Number, // days
      required: true,
    },
    idealTemperature: {
      min: Number,
      max: Number,
    },
    waterRequirement: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Crop", cropSchema);

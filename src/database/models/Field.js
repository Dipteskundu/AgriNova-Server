const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a field name"],
      trim: true,
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farm",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    area: {
      type: Number,
      required: [true, "Please add field area in acres"],
    },
    season: {
      type: String,
      enum: ["spring", "summer", "autumn", "winter"],
      required: true,
    },
    soilType: {
      type: String,
    },
    irrigationType: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Field", fieldSchema);

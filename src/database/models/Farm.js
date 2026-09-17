const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a farm name"],
      trim: true,
    },
    description: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      address: String,
      district: String,
      division: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    totalArea: {
      type: Number,
      required: [true, "Please add total area"],
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

module.exports = mongoose.model("Farm", farmSchema);

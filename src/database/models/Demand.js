const mongoose = require("mongoose");

const demandSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: String,
      required: [true, "Please add product name"],
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "kg",
    },
    qualityRequirements: {
      type: String,
    },
    preferredLocation: {
      type: String,
    },
    deliveryRequirements: {
      type: String,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["open", "matched", "fulfilled", "expired"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Demand", demandSchema);

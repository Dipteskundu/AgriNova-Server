const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add product name"],
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      enum: ["seeds", "fertilizer", "pesticide", "tools", "equipment", "irrigation", "packaging"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "kg",
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    image: {
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

module.exports = mongoose.model("Product", productSchema);

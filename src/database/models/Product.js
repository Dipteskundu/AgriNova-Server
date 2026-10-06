const mongoose = require("mongoose");

/**
 * Supplier input catalogue (seeds, fertilizer, tools…).
 *
 * `name`, `description`, `category`, `price`, `unit`, `supplier`, `stock`,
 * `image` and `isActive` are the original fields — nothing here is renamed,
 * so any existing reader keeps working.
 *
 * `minimumOrderQuantity` is additive: the supplier portal's product card
 * needs a stated MOQ and the schema had no field for it.
 */
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
      min: 0,
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
      min: 0,
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── supplier portal (additive) ─────────────────────────────
    minimumOrderQuantity: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ supplier: 1, isActive: 1 });

module.exports = mongoose.model("Product", productSchema);

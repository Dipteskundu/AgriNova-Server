const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: [true, "Please add an order code"], trim: true },
    buyerName: { type: String, default: "" },
    farmerName: { type: String, default: "" },
    produceItem: { type: String, default: "" },
    volumeKg: { type: Number, default: 0 },
    totalValueBdt: { type: Number, default: 0 },
    escrowStatus: { type: String, default: "Held in Escrow" },
    fulfillmentStatus: { type: String, default: "Order Placed" },
    orderDate: { type: String, default: "" },
    logisticsPartner: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

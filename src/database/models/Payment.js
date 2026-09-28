const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transactionRef: { type: String, required: [true, "Please add a transaction reference"], trim: true },
    recipientName: { type: String, default: "" },
    recipientRole: { type: String, default: "Farmer" },
    amountBdt: { type: Number, required: [true, "Please add an amount"], min: 0 },
    purpose: { type: String, default: "Harvest Sale Payout" },
    payoutStatus: { type: String, default: "Pending Approval" },
    paymentChannel: { type: String, default: "bKash Merchant" },
    initiatedAt: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

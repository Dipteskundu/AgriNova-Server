const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: [true, "Please add a case number"], trim: true },
    plaintiff: {
      name: { type: String, default: "" },
      role: { type: String, default: "Farmer" },
    },
    defendant: {
      name: { type: String, default: "" },
      role: { type: String, default: "Buyer" },
    },
    relatedOrderCode: { type: String, default: "" },
    disputeReason: { type: String, default: "Payment Delay" },
    disputedAmountBdt: { type: Number, default: 0 },
    evidenceAttachmentsCount: { type: Number, default: 0 },
    caseStatus: { type: String, default: "Open - Under Review" },
    openedAt: { type: String, default: "" },
    resolutionNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);

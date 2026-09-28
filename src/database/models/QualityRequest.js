const mongoose = require("mongoose");

const qualityReportSchema = new mongoose.Schema(
  {
    batchCode: { type: String, required: [true, "Please add a batch code"], trim: true },
    produceType: { type: String, default: "" },
    farmerName: { type: String, default: "" },
    testingLabLocation: { type: String, default: "" },
    inspectorName: { type: String, default: "" },
    assignedGrade: { type: String, default: "Grade A" },
    moistureContentPercent: { type: Number, default: 0 },
    moistureStandardThreshold: { type: Number, default: 0 },
    foreignMatterPercent: { type: Number, default: 0 },
    aflatoxinPpm: { type: Number, default: 0 },
    complianceVerdict: { type: String, default: "Passed" },
    inspectionDate: { type: String, default: "" },
    certificateNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QualityRequest", qualityReportSchema);

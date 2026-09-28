const mongoose = require("mongoose");

const logisticsSchema = new mongoose.Schema(
  {
    consignmentCode: { type: String, required: [true, "Please add a consignment code"], trim: true },
    originHub: { type: String, default: "" },
    destinationDepot: { type: String, default: "" },
    cargoDescription: { type: String, default: "" },
    cargoWeightKg: { type: Number, default: 0 },
    vehicleType: { type: String, default: "Open Bed Truck" },
    driverName: { type: String, default: "" },
    driverPhone: { type: String, default: "" },
    temperatureCelsius: { type: Number, default: 0 },
    targetTempRange: { type: String, default: "" },
    transitStatus: { type: String, default: "Dispatched" },
    estimatedArrival: { type: String, default: "" },
    coldChainIntegrity: { type: String, default: "Optimal" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", logisticsSchema);

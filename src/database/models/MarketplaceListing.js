const mongoose = require("mongoose");

const marketplaceListingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    farmerName: { type: String, default: "" },
    farmerPhone: { type: String, default: "" },
    produceName: { type: String, required: [true, "Please add produce name"], trim: true },
    variety: { type: String, default: "" },
    category: { type: String, default: "" },
    quantityAvailableKg: { type: Number, default: 0 },
    askingPricePerKg: { type: Number, default: 0 },
    suggestedFloorPrice: { type: Number, default: 0 },
    suggestedCeilingPrice: { type: Number, default: 0 },
    qualityGrade: { type: String, default: "Grade A" },
    locationHub: { type: String, default: "" },
    status: { type: String, default: "Pending Review" },
    listedDate: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketplaceListing", marketplaceListingSchema);

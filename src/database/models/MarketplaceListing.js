const mongoose = require("mongoose");

/**
 * Produce listing.
 *
 * NOTE ON FIELD NAMES — the admin portal's `admin.mappers.js` reads
 * `produceName`, `quantityAvailableKg`, `askingPricePerKg`, `locationHub`,
 * `suggestedFloorPrice`, `suggestedCeilingPrice`, `status` and `listedDate`.
 * Never rename or remove those: they are live. The marketplace module adds the
 * richer buyer-facing fields below and maps both sets to the frontend's
 * `ProduceListing` shape in `marketplace.mappers.js`.
 */
const marketplaceListingSchema = new mongoose.Schema(
  {
    // ── ownership / provenance ────────────────────────────────
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── legacy admin fields (READ BY admin.mappers.js — do not rename) ──
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

    // ── buyer-facing fields (marketplace portal) ──────────────
    farmerLocation: { type: String, default: "" },
    farmerAvatar: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    minimumOrderKg: { type: Number, default: 1 },
    harvestDate: { type: String, default: "" },
    availableUntil: { type: String, default: "" },
    location: { type: String, default: "" },
    district: { type: String, default: "" },
    tags: { type: [String], default: [] },
    totalSoldKg: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },

    // ── links to the quality + harvest chain (proposal §6.10) ──
    harvestLot: { type: mongoose.Schema.Types.ObjectId, ref: "Harvest" },
    qualityReport: { type: mongoose.Schema.Types.ObjectId, ref: "QualityRequest" },
  },
  { timestamps: true }
);

marketplaceListingSchema.index({ owner: 1, status: 1 });
marketplaceListingSchema.index({ category: 1, qualityGrade: 1, status: 1 });

module.exports = mongoose.model("MarketplaceListing", marketplaceListingSchema);

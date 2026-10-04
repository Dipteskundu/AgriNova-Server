const MarketplaceListing = require("../../database/models/MarketplaceListing");
const { mapListing, categoryQuery } = require("./marketplace.mappers");
const { today } = require("../../utils/dates");

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isAdmin = (user) =>
  !!user && (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

const PUBLIC_STATUS = "Approved";

/**
 * Build the Mongo filter for GET /marketplace/listings.
 *
 * Three modes:
 *   - default        → public browse, only `Approved` listings
 *   - ?mine=1        → the caller's own listings, any status (manage view)
 *   - ?status=X      → explicit status override (admin moderation)
 */
function buildFilter(query = {}, user) {
  const filter = {};

  if (query.mine === "1" || query.mine === "true") {
    if (!user) throw httpError("Authentication required to list your own produce", 401);
    if (!isAdmin(user)) filter.owner = user.id;
  } else if (query.status) {
    // Explicit status override is moderation-only. Without this, an anonymous
    // caller could pass ?status=Flagged and read listings that are not public.
    if (!isAdmin(user)) throw httpError("Access denied", 403);
    filter.status = String(query.status);
  } else if (isAdmin(user) && query.all === "1") {
    // admin asked for the whole book
  } else {
    filter.status = PUBLIC_STATUS;
  }

  // Union value from the UI vs. prose stored by admin/legacy records — matched
  // through the alias table rather than exact equality (see mappers).
  if (query.category) filter.category = categoryQuery(query.category);
  if (query.grade) filter.qualityGrade = String(query.grade);
  if (query.district) {
    filter.district = { $regex: String(query.district).trim(), $options: "i" };
  }
  if (query.verifiedOnly === "1" || query.verifiedOnly === "true") {
    filter.isVerified = true;
  }

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.askingPricePerKg = {};
    if (Number.isFinite(minPrice)) filter.askingPricePerKg.$gte = minPrice;
    if (Number.isFinite(maxPrice)) filter.askingPricePerKg.$lte = maxPrice;
  }

  if (query.search) {
    const rx = { $regex: String(query.search).trim(), $options: "i" };
    filter.$or = [
      { produceName: rx },
      { variety: rx },
      { farmerName: rx },
      { location: rx },
      { district: rx },
      { locationHub: rx },
    ];
  }

  return filter;
}

async function listListings(query, user) {
  const filter = buildFilter(query, user);
  const docs = await MarketplaceListing.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  return docs.map(mapListing);
}

async function getListing(id, user) {
  const doc = await MarketplaceListing.findById(id).lean();
  if (!doc) throw httpError("Listing not found", 404);

  const isOwner =
    !!user && doc.owner && String(doc.owner) === String(user.id);

  // Private statuses (pending/flagged/rejected) are only visible to their
  // owner and to admins — the public must never see unapproved produce.
  if (!isOwner && !isAdmin(user) && String(doc.status) !== PUBLIC_STATUS) {
    throw httpError("Listing not found", 404);
  }
  return mapListing(doc);
}

async function createListing(user, payload = {}) {
  const loc = user.primaryLocation || {};
  const place = [loc.village, loc.upazila, loc.district].filter(Boolean).join(", ");

  const doc = await MarketplaceListing.create({
    ...payload,
    owner: user.id,
    farmerName: payload.farmerName || user.name || "",
    farmerPhone: payload.farmerPhone || user.phone || "",
    farmerLocation: payload.farmerLocation || place || user.address || user.region || "",
    district: payload.district || loc.district || "",
    listedDate: payload.listedDate || today(),
    status: payload.status || "Pending Review",
    totalSoldKg: payload.totalSoldKg || 0,
  });
  return mapListing(doc.toObject());
}

async function loadOwned(id, user) {
  const doc = await MarketplaceListing.findById(id);
  if (!doc) throw httpError("Listing not found", 404);
  const owns = doc.owner && String(doc.owner) === String(user.id);
  if (!owns && !isAdmin(user)) {
    throw httpError("You do not have permission to modify this listing", 403);
  }
  return doc;
}

async function updateListing(id, user, payload = {}) {
  const doc = await loadOwned(id, user);

  // Moderation fields are admin-exclusive. Rejecting loudly beats silently
  // dropping them — a farmer who PATCHes `status: "Approved"` must not be
  // told 200 OK when nothing changed.
  if (!isAdmin(user)) {
    const attempted = ["status", "isVerified"].filter((f) => f in payload);
    if (attempted.length) {
      throw httpError(
        `Only an admin may set ${attempted.join(" or ")}`,
        403
      );
    }
  }

  // Never let an update reassign ownership or touch internal ids.
  delete payload.owner;
  delete payload._id;

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) delete payload[key];
  });

  Object.assign(doc, payload);
  await doc.save();
  return mapListing(doc.toObject());
}

async function deleteListing(id, user) {
  const doc = await loadOwned(id, user);
  await doc.deleteOne();
  return { success: true, id: String(doc._id) };
}

/** KPI helper for the marketplace/farmer dashboards. */
async function marketplaceStats() {
  const [total, approved, pending] = await Promise.all([
    MarketplaceListing.countDocuments({}),
    MarketplaceListing.countDocuments({ status: PUBLIC_STATUS }),
    MarketplaceListing.countDocuments({ status: "Pending Review" }),
  ]);
  return { totalListings: total, approvedListings: approved, pendingReview: pending };
}

module.exports = {
  listListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  marketplaceStats,
};

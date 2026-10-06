const { validationResult } = require("express-validator");
const service = require("./marketplace.service");
const { logAudit } = require("../../utils/audit");

/**
 * Pulls express-validator failures out of the request and turns them into a
 * `{ statusCode: 400, message }` error the global error middleware renders as
 * `{ message }` — the exact shape `lib/api.ts` reads.
 */
function throwIfInvalid(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return;

  const err = new Error(
    result
      .array()
      .map((e) => e.msg)
      .join("; ")
  );
  err.statusCode = 400;
  throw err;
}

/** `handle` catches everything and defers to the global error middleware. */
const handle = (fn) => async (req, res, next) => {
  try {
    res.json(await fn(req, res));
  } catch (err) {
    next(err);
  }
};

exports.list = handle((req) => service.listListings(req.query, req.user));

exports.get = handle((req) => service.getListing(req.params.id, req.user));

exports.create = handle(async (req, res) => {
  throwIfInvalid(req);
  const doc = await service.createListing(req.user, req.body || {});
  res.status(201);
  await logAudit({
    req,
    action: "CREATE",
    entity: "MarketplaceListing",
    entityId: doc.id,
    details: `Listed produce "${doc.cropName}"`,
  });
  return doc;
});

exports.update = handle(async (req) => {
  throwIfInvalid(req);
  const doc = await service.updateListing(req.params.id, req.user, req.body || {});
  await logAudit({
    req,
    action: "UPDATE",
    entity: "MarketplaceListing",
    entityId: req.params.id,
    details: `Updated listing "${doc.cropName}"`,
  });
  return doc;
});

exports.remove = handle(async (req) => {
  const result = await service.deleteListing(req.params.id, req.user);
  await logAudit({
    req,
    action: "DELETE",
    entity: "MarketplaceListing",
    entityId: result.id,
    details: "Removed produce listing",
  });
  return result;
});

exports.stats = handle(() => service.marketplaceStats());

/**
 * Favourites — the buyer's saved shelf.
 *
 * Deliberately audit-free. `logAudit` elsewhere records business events
 * (a listing changing hands, money moving); a heart is an easily reversed
 * preference, and logging every click would bury those events under an
 * afternoon of browsing.
 */
exports.savedList = handle((req) => service.listSaved(req.user));

exports.save = handle(async (req) => {
  throwIfInvalid(req);
  return service.saveListing(req.user, req.params.id);
});

exports.unsave = handle(async (req) => {
  throwIfInvalid(req);
  return service.unsaveListing(req.user, req.params.id);
});

/**
 * Persist a produce photo and hand back the URL to store in `imageUrl`.
 *
 * The URL is absolute because the frontend serves pages from a different
 * origin than this API — a bare `/uploads/…` would resolve against the Next.js
 * host and404. Falls back to the request host, which is correct behind a
 * direct connection (the normal dev/prod setup here).
 */
exports.uploadImage = handle(async (req) => {
  if (!req.file) {
    const err = new Error(
      'No image received. Send a JPEG, PNG, GIF or WebP file under 5 MB in the "image" field.'
    );
    err.statusCode = 400;
    throw err;
  }
  const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`;
  return { url: `${base.replace(/\/$/, "")}/uploads/${req.file.filename}` };
});

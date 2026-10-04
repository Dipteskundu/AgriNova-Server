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

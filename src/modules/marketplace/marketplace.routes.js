const express = require("express");
const auth = require("../../middleware/auth.middleware");
const optionalAuth = require("../../middleware/optionalAuth.middleware");
const role = require("../../middleware/role.middleware");
const controller = require("./marketplace.controller");
const validation = require("./marketplace.validation");

const router = express.Router();

/**
 * Produce Marketplace — MARKETPLACE_PORTAL_PLAN Step 2.
 *
 *   GET    /api/marketplace/listings        public browse (Approved only)
 *   GET    /api/marketplace/listings/stats  moderation counters (admin)
 *   GET    /api/marketplace/listings/mine   caller's own listings (any status)
 *   GET    /api/marketplace/listings/:id    single listing
 *   POST   /api/marketplace/listings        farmer / supplier / admin
 *   PUT    /api/marketplace/listings/:id    owner or admin
 *   DELETE /api/marketplace/listings/:id    owner or admin
 *
 * Reads are unauthenticated on purpose: `(marketplace)/browse` has no
 * RouteGuard, so an anonymous visitor must be able to load the catalogue.
 * Writes require a token, and only moderation fields are admin-exclusive —
 * the service enforces owner-or-admin on update/delete.
 *
 * Static sub-routes are declared before "/listings/:id" so "stats"/"mine"
 * are not swallowed as an `:id` capture.
 */

router.get(
  "/listings",
  optionalAuth,
  validation.listListingsValidation,
  controller.list
);
router.get("/listings/stats", auth, role(["admin"]), controller.stats);
router.get(
  "/listings/mine",
  auth,
  (req, res, next) => {
    req.query = { ...req.query, mine: "1" };
    next();
  },
  validation.listListingsValidation,
  controller.list
);
router.get("/listings/:id", controller.get);

router.post(
  "/listings",
  auth,
  role(["farmer", "supplier", "admin"]),
  validation.createListingValidation,
  controller.create
);

router.put(
  "/listings/:id",
  auth,
  role(["farmer", "supplier", "admin"]),
  validation.updateListingValidation,
  controller.update
);

router.delete(
  "/listings/:id",
  auth,
  role(["farmer", "supplier", "admin"]),
  controller.remove
);

module.exports = router;

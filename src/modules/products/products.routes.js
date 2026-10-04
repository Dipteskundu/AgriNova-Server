const express = require("express");
const auth = require("../../middleware/auth.middleware");
const optionalAuth = require("../../middleware/optionalAuth.middleware");
const role = require("../../middleware/role.middleware");
const Product = require("../../database/models/Product");
const { mapSupplierProduct } = require("../../utils/domainMaps");
const { validateProduct } = require("./products.validation");
const { logAudit } = require("../../utils/audit");

const isAdmin = (user) =>
  !!user &&
  (user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin")));

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const supplierIdOf = (doc) =>
  doc.supplier
    ? String(doc.supplier._id !== undefined ? doc.supplier._id : doc.supplier)
    : "";

/**
 * Supplier input catalogue — `/inputs`, the second half of the marketplace
 * feature (MARKETPLACE_AS_FEATURE_PLAN P4).
 *
 *   GET    /api/products        public list  — anonymous sees active stock only
 *   GET    /api/products/:id    public read
 *   POST   /api/products        supplier / admin
 *   PUT    /api/products/:id    owner or admin
 *   DELETE /api/products/:id    owner or admin
 *
 * Reads are unauthenticated on purpose: `/inputs` has no RouteGuard, so an
 * anonymous visitor has to be able to load the catalogue. What changes per
 * caller is only *which rows* they see:
 *
 *   anonymous  → `{ isActive: true }` — saleable stock, nothing half-listed
 *   session    → their own rows (any status) ∪ every other active row, so a
 *                supplier's own drafts appear alongside the public catalogue
 *   admin      → everything
 *
 * Writes never become public: they carry `auth` + `role`, and update/delete
 * re-check ownership below (the id of a populated `supplier` has to be read
 * through `_id`, otherwise the comparison stringifies a whole document).
 */
const router = express.Router();

function readScope(req) {
  if (isAdmin(req.user)) return {};
  if (req.user) {
    return { $or: [{ supplier: req.user.id }, { isActive: true }] };
  }
  return { isActive: true };
}

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { query, user } = req;

    if (query.mine === "1") {
      if (!user) throw httpError("Sign in to see your own products", 401);
      const docs = await Product.find({ supplier: user.id })
        .sort({ createdAt: -1, _id: -1 })
        .populate("supplier", "name");
      return res.json(docs.map(mapSupplierProduct));
    }

    const scope = readScope(req);

    if (query.category) {
      scope.category = String(query.category).toLowerCase();
    }
    if (query.available === "1") scope.isActive = true;
    if (query.search) {
      const re = new RegExp(
        String(query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      scope.$and = [{ $or: [{ name: re }, { description: re }] }];
    }

    const docs = await Product.find(scope)
      .sort({ createdAt: -1, _id: -1 })
      .populate("supplier", "name");
    res.json(docs.map(mapSupplierProduct));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id).populate("supplier", "name");
    if (!doc) throw httpError("Product not found", 404);

    const visible =
      isAdmin(req.user) ||
      !!doc.isActive ||
      (req.user && supplierIdOf(doc) === String(req.user.id));
    if (!visible) throw httpError("Product not found", 404);

    res.json(mapSupplierProduct(doc));
  } catch (err) {
    next(err);
  }
});

router.post("/", auth, role(["supplier", "admin"]), async (req, res, next) => {
  try {
    const payload = validateProduct(req.body, { partial: false });
    payload.supplier = req.user.id;

    const doc = await Product.create(payload);
    // `populate` only runs on the read paths, so run it here too rather than
    // hand-stitching `{_id, name}` onto an ObjectId path — mongoose would try
    // to cast that object and drop the reference.
    await doc.populate("supplier", "name");

    await logAudit({
      req,
      action: "CREATE",
      entity: "Product",
      entityId: String(doc._id),
      details: `Created product ${doc.name}`,
    });
    res.status(201).json(mapSupplierProduct(doc));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", auth, role(["supplier", "admin"]), async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id).populate("supplier", "name");
    if (!doc) throw httpError("Product not found", 404);

    const owns = supplierIdOf(doc) === String(req.user.id);
    if (!owns && !isAdmin(req.user)) {
      throw httpError("You do not have permission to edit this product", 403);
    }

    // `validateProduct` drops `supplier`, so a client cannot move a product
    // to another supplier by editing it.
    Object.assign(doc, validateProduct(req.body, { partial: true }));
    await doc.save();

    await logAudit({
      req,
      action: "UPDATE",
      entity: "Product",
      entityId: String(doc._id),
      details: `Updated product ${doc.name}`,
    });
    res.json(mapSupplierProduct(doc));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", auth, role(["supplier", "admin"]), async (req, res, next) => {
  try {
    const doc = await Product.findById(req.params.id).populate("supplier", "name");
    if (!doc) throw httpError("Product not found", 404);

    const owns = supplierIdOf(doc) === String(req.user.id);
    if (!owns && !isAdmin(req.user)) {
      throw httpError("You do not have permission to delete this product", 403);
    }

    const id = String(doc._id);
    const name = doc.name;
    await doc.deleteOne();

    await logAudit({
      req,
      action: "DELETE",
      entity: "Product",
      entityId: id,
      details: `Deleted product ${name}`,
    });
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

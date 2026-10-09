const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../../middleware/auth.middleware");
const role = require("../../middleware/role.middleware");
const Delivery = require("../../database/models/Delivery");
const { logAudit } = require("../../utils/audit");
const { mapBuyerDelivery } = require("../../utils/domainMaps");
const { DELIVERY_STATUSES, updateDeliveryStatus } = require("./delivery.service");

const router = express.Router();
const readRoles = ["buyer", "admin", "logistics"];
const writeRoles = ["admin", "logistics"];
const orderFields =
  "buyerName farmerName deliveryAddress estimatedDelivery deliveredAt fulfillmentStatus";

function isBuyerOnly(user) {
  const roles = new Set([
    ...(Array.isArray(user.roles) ? user.roles : []),
    user.role,
  ].filter(Boolean));
  return roles.has("buyer") && !roles.has("admin") && !roles.has("logistics");
}

function validationError(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return null;
  const error = new Error(result.array().map((item) => item.msg).join("; "));
  error.statusCode = 400;
  return error;
}

async function findVisibleDelivery(req, id) {
  const query = { _id: id };
  if (isBuyerOnly(req.user)) query.owner = req.user.id;
  const delivery = await Delivery.findOne(query).populate("order", orderFields);
  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    throw error;
  }
  return delivery;
}

router.get("/", auth, role(readRoles), async (req, res, next) => {
  try {
    const query = isBuyerOnly(req.user) ? { owner: req.user.id } : {};
    const deliveries = await Delivery.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .populate("order", orderFields);
    res.json(
      deliveries
        .filter(
          (delivery) =>
            delivery.order && delivery.order.fulfillmentStatus !== "Cancelled"
        )
        .map(mapBuyerDelivery)
    );
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id/status",
  auth,
  role(writeRoles),
  body("status").isIn(DELIVERY_STATUSES).withMessage("Unknown delivery status"),
  body("note")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Note must be 300 characters or fewer"),
  async (req, res, next) => {
    try {
      const invalid = validationError(req);
      if (invalid) throw invalid;
      const delivery = await updateDeliveryStatus(
        req.params.id,
        req.body.status,
        req.body.note || ""
      );
      const populated = await Delivery.findById(delivery._id).populate(
        "order",
        orderFields
      );
      await logAudit({
        req,
        action: "UPDATE",
        entity: "Delivery",
        entityId: String(delivery._id),
        details: `${delivery.consignmentNo}: status changed to ${delivery.status}`,
      });
      res.json(mapBuyerDelivery(populated));
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id",
  auth,
  role(writeRoles),
  body("consignmentNo")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("Consignment number must be 80 characters or fewer"),
  body("vehicle")
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage("Vehicle must be 120 characters or fewer"),
  body("driver")
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage("Driver must be 120 characters or fewer"),
  async (req, res, next) => {
    try {
      const invalid = validationError(req);
      if (invalid) throw invalid;
      const allowed = ["consignmentNo", "vehicle", "driver"];
      const fields = allowed.filter((key) => req.body[key] !== undefined);
      if (!fields.length) {
        const error = new Error("Provide consignmentNo, vehicle, or driver");
        error.statusCode = 400;
        throw error;
      }
      const delivery = await Delivery.findById(req.params.id);
      if (!delivery) {
        const error = new Error("Delivery not found");
        error.statusCode = 404;
        throw error;
      }
      if (!delivery.order) {
        const error = new Error("This legacy delivery is not linked to an order");
        error.statusCode = 409;
        throw error;
      }
      fields.forEach((key) => {
        delivery[key] = req.body[key];
      });
      if (req.body.consignmentNo !== undefined) {
        delivery.consignmentCode = req.body.consignmentNo;
      }
      if (req.body.vehicle !== undefined) delivery.vehicleType = req.body.vehicle;
      if (req.body.driver !== undefined) delivery.driverName = req.body.driver;
      await delivery.save();
      const populated = await Delivery.findById(delivery._id).populate(
        "order",
        orderFields
      );
      await logAudit({
        req,
        action: "UPDATE",
        entity: "Delivery",
        entityId: String(delivery._id),
        details: `Updated delivery details for ${delivery.consignmentNo}`,
      });
      res.json(mapBuyerDelivery(populated));
    } catch (error) {
      next(error);
    }
  }
);

router.get("/:id", auth, role(readRoles), async (req, res, next) => {
  try {
    const delivery = await findVisibleDelivery(req, req.params.id);
    res.json(mapBuyerDelivery(delivery));
  } catch (error) {
    next(error);
  }
});

module.exports = router;

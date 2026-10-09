const Delivery = require("../../database/models/Delivery");
const Order = require("../../database/models/Order");
const { startClock } = require("../orders/escrow.service");

const DELIVERY_STATUSES = [
  "Pending",
  "Picked up",
  "In transit",
  "Out for delivery",
  "Delivered",
];

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureDeliveryForOrder(order) {
  const orderId = order._id || order.id;
  const consignmentNo = `CON-${order.orderCode}`;
  const initialEvent = {
    status: "Pending",
    note: "Delivery record created",
    at: new Date().toISOString(),
  };
  try {
    return await Delivery.findOneAndUpdate(
      { order: orderId },
      {
        $setOnInsert: {
          order: orderId,
          consignmentNo,
          consignmentCode: consignmentNo,
          owner: order.owner,
          orderCode: order.orderCode || "",
          cargoDescription: [order.produceItem, order.volumeKg, order.unitLabel || "kg"]
            .filter(Boolean)
            .join(" — "),
          cargoWeightKg: Number(order.volumeKg) || 0,
          destinationDepot: order.deliveryAddress || "",
          estimatedArrival: order.estimatedDelivery || "",
          status: "Pending",
          transitStatus: "Pending",
          events: [initialEvent],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await Delivery.findOne({ order: orderId });
    if (!existing) throw error;
    return existing;
  }
}

async function updateDeliveryStatus(deliveryId, status, note = "") {
  if (!DELIVERY_STATUSES.includes(status)) {
    throw httpError("Unknown delivery status", 400);
  }

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw httpError("Delivery not found", 404);
  if (!delivery.order) {
    throw httpError("This legacy delivery is not linked to an order", 409);
  }
  const currentIndex = DELIVERY_STATUSES.indexOf(delivery.status);
  const requestedIndex = DELIVERY_STATUSES.indexOf(status);
  if (delivery.status === "Delivered" && status !== "Delivered") {
    throw httpError("A delivered order cannot be changed", 409);
  }
  if (requestedIndex < currentIndex) {
    throw httpError("Delivery status can only move forward", 409);
  }
  if (status === "Pending") {
    throw httpError("Delivery status must advance from Pending", 409);
  }

  let updatedDelivery = delivery;
  if (requestedIndex > currentIndex) {
    const at = new Date().toISOString();
    const statusFilter =
      delivery.status === "Pending"
        ? { $or: [{ status: "Pending" }, { status: { $exists: false } }] }
        : { status: delivery.status };
    updatedDelivery = await Delivery.findOneAndUpdate(
      { _id: deliveryId, ...statusFilter },
      {
        $set: { status, transitStatus: status },
        $push: { events: { status, note, at } },
      },
      { new: true, runValidators: true }
    );
    if (!updatedDelivery) {
      throw httpError("Delivery status changed concurrently; reload and try again", 409);
    }
  }

  const order = await Order.findById(delivery.order);
  if (!order) throw httpError("Order linked to delivery was not found", 404);
  if (status === "Picked up" || status === "In transit" || status === "Out for delivery") {
    order.fulfillmentStatus = "In Transit";
  } else if (status === "Delivered") {
    order.fulfillmentStatus = "Delivered";
    const deliveredEvent = [...updatedDelivery.events]
      .reverse()
      .find((event) => event.status === "Delivered");
    order.deliveredAt = order.deliveredAt || (deliveredEvent && deliveredEvent.at) || new Date().toISOString();
    startClock(order);
  }
  if (!Array.isArray(order.trackingSteps)) order.trackingSteps = [];
  const step = order.trackingSteps.find((item) => item.label === status);
  if (step) {
    step.done = true;
  } else {
    const statusEvent = [...updatedDelivery.events]
      .reverse()
      .find((event) => event.status === status);
    order.trackingSteps.push({
      label: status,
      date: (statusEvent && statusEvent.at) || new Date().toISOString(),
      done: true,
    });
  }
  await order.save();

  return updatedDelivery;
}

module.exports = { DELIVERY_STATUSES, ensureDeliveryForOrder, updateDeliveryStatus };

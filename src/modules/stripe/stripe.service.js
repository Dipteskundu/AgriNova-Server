const Order = require("../../database/models/Order");
const Payment = require("../../database/models/Payment");
const { today } = require("../../utils/dates");
const { logAudit } = require("../../utils/audit");

/**
 * Apply a verified Stripe payment to its orders. Safe to call from both the
 * signed webhook and the authenticated return-status endpoint.
 */
async function confirmStripeSession(sessionId) {
  const orders = await Order.find({ stripeSessionId: sessionId });

  for (const doc of orders) {
    if (doc.stripePaidAt) continue;

    const replayed = await Payment.findOne({
      orderCode: doc.orderCode,
      direction: "purchase",
    });
    if (!replayed) {
      await Payment.create({
        transactionRef: sessionId,
        owner: doc.owner,
        direction: "purchase",
        orderCode: doc.orderCode,
        amountBdt: Number(doc.totalValueBdt) || 0,
        method: "Card",
        purpose: `Purchase of ${doc.produceItem} (Stripe)`,
        paymentChannel: "Stripe Checkout",
        payoutStatus: "Pending Approval",
        initiatedAt: today(),
        paidAt: today(),
      });
    }

    doc.stripePaidAt = today();
    doc.trackingSteps = [
      ...(Array.isArray(doc.trackingSteps) ? doc.trackingSteps : []),
      { label: "Stripe payment confirmed", date: today(), done: true },
    ];
    await doc.save();

    await logAudit({
      req: null,
      action: "UPDATE",
      entity: "Order",
      entityId: String(doc._id),
      details: `Stripe payment received for ${doc.orderCode} (session ${sessionId})`,
    });
  }

  return orders.length;
}

module.exports = { confirmStripeSession };

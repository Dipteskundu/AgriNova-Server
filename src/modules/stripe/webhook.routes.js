const express = require("express");
const { getStripe, requireWebhookSecret } = require("../../config/stripe");
const { confirmStripeSession } = require("./stripe.service");

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 *
 * Mounted BEFORE `express.json()` in `src/app.js` on purpose: Stripe signs the
 * raw request body, and the global JSON parser would have already consumed it.
 * The route re-parses with `express.raw` and verifies `stripe-signature`
 * against `STRIPE_WEBHOOK_SECRET` — a body Stripe did not sign is rejected
 * with a 400, never processed.
 */
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        req.body,
        sig,
        requireWebhookSecret()
      );
    } catch (err) {
      return res
        .status(400)
        .json({ message: `Webhook signature verification failed: ${err.message}` });
    }

    if (event.type === "checkout.session.completed") {
      await confirmStripeSession(event.data.object.id);
    }

    // Any event at all is acknowledged with 200; events outside the one we
    // handle (payment_intent.succeeded, checkout.session.expired, …) are no-ops.
    res.json({ received: true });
  }
);

module.exports = router;
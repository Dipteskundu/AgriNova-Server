const Stripe = require("stripe");

/**
 * Lazy Stripe client.
 *
 * Kept separate from `services.js` because constructing a Stripe client from
 * an unset key would throw at boot and take the whole app down. The client is
 * built on first use (a checkout or a webhook) and cached, mirroring how
 * `cloudinary.js` guards its own three vars.
 *
 * `getStripe()` throws a 503-carrying error when `STRIPE_SECRET_KEY` is not
 * configured so the checkout endpoint answers with a clear message instead of
 * leaking a stack trace. `requireWebhookSecret()` does the same for the
 * webhook path, which needs the `whsec_...` secret regardless of the client.
 */
let client = null;

function getStripe() {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      const err = new Error("STRIPE_SECRET_KEY is not configured on the server");
      err.statusCode = 503;
      throw err;
    }
    // Test mode only: `sk_test_...` keys. Live keys are never enabled by
    // this code — the deployment's `.env` decides what it is given.
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

/** Build event payloads without touching the secret — the webhook verifies it. */
function requireWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    const err = new Error("STRIPE_WEBHOOK_SECRET is not configured on the server");
    err.statusCode = 503;
    throw err;
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

module.exports = { getStripe, requireWebhookSecret };
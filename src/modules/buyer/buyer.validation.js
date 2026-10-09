const { body } = require("express-validator");

/**
 * Order validation.
 *
 * Uses a factory for the same reason `marketplace.validation.js` does:
 * `chain.optional()` mutates the chain in place, so deriving one rule set from
 * another shared array silently makes the first set optional as well.
 */

function checkoutRules() {
  return [
    // A cart line is either produce (`listingId`) or an input (`productId`).
    // Both are optional here so one rule set can serve the shared cart; the
    // cross-field check below is what insists on exactly one of them.
    body("listingId")
      .optional({ values: "falsy" })
      .isMongoId()
      .withMessage("Unknown listing id"),

    body("productId")
      .optional({ values: "falsy" })
      .isMongoId()
      .withMessage("Unknown product id"),

    body()
      .custom((_, { req }) => {
        const { listingId, productId } = req.body || {};
        if (!listingId && !productId) {
          throw new Error("Choose an item to order");
        }
        if (listingId && productId) {
          throw new Error("Order one cart line at a time");
        }
        return true;
      }),

    body("quantityKg")
      .exists()
      .withMessage("Quantity is required")
      .bail()
      .isFloat({ gt: 0 })
      .withMessage("Quantity must be greater than zero"),

    body("deliveryAddress")
      .trim()
      .notEmpty()
      .withMessage("A delivery address is required")
      .isLength({ min: 10, max: 240 })
      .withMessage("Delivery address must be 10–240 characters"),

    body("phone")
      .trim()
      .customSanitizer((v) => String(v || "").replace(/[\s-]/g, "").replace(/^(\+?88)/, ""))
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^01[3-9]\d{8}$/)
      .withMessage("Invalid Bangladesh mobile number"),

    body("notes")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes must be 500 characters or fewer"),

    body("paymentMethod")
      .optional()
      .isIn(["bKash", "Nagad", "Rocket", "Card", "Bank Transfer"])
      .withMessage("Unsupported payment method"),

    body("estimatedDelivery")
      .optional({ values: "falsy" })
      .isISO8601()
      .withMessage("Estimated delivery must be a date"),
  ];
}

/**
 * Validation for `POST /api/orders/stripe-checkout`.
 *
 * One Checkout Session covers the whole cart, so the body is reversed: instead
 * of a single `listingId`/`productId` (that is the per-line `/checkout`), it
 * carries `items: [{ listingId?, productId?, quantityKg }]`. The cross-field
 * "exactly one of listingId/productId" per element is enforced here the same
 * way `checkoutRules` does for a single line; prices, stock and minimums are
 * still re-checked server-side in `resolveLineFromInput`, never by this rule
 * set alone.
 */
function stripeCheckoutRules() {
  return [
    body("items")
      .exists()
      .withMessage("Cart items are required")
      .bail()
      .isArray({ min: 1 })
      .withMessage("Your cart is empty"),

    body("items.*.listingId")
      .optional({ values: "falsy" })
      .isMongoId()
      .withMessage("Unknown listing id"),

    body("items.*.productId")
      .optional({ values: "falsy" })
      .isMongoId()
      .withMessage("Unknown product id"),

    body("items.*.quantityKg")
      .exists()
      .withMessage("Quantity is required")
      .bail()
      .isFloat({ gt: 0 })
      .withMessage("Quantity must be greater than zero"),

    body("items")
      .custom((items) => {
        if (!Array.isArray(items)) return true;
        items.forEach((item) => {
          const hasListing = !!item?.listingId;
          const hasProduct = !!item?.productId;
          if (hasListing && hasProduct) {
            throw new Error("Order one cart line at a time");
          }
          if (!hasListing && !hasProduct) {
            throw new Error("Choose an item to order");
          }
        });
        return true;
      }),

    body("deliveryAddress")
      .trim()
      .notEmpty()
      .withMessage("A delivery address is required")
      .isLength({ min: 10, max: 240 })
      .withMessage("Delivery address must be 10–240 characters"),

    body("phone")
      .trim()
      .customSanitizer((v) => String(v || "").replace(/[\s-]/g, "").replace(/^(\+?88)/, ""))
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^01[3-9]\d{8}$/)
      .withMessage("Invalid Bangladesh mobile number"),

    body("notes")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes must be 500 characters or fewer"),
  ];
}

/**
 * Dispute validation for `POST /api/orders/:id/dispute`.
 *
 * `reason` is an enum rather than free text so the admin Disputes board's
 * reason column stays filterable. `'Order Not Received'` is the one addition
 * to the union in `types/index.ts` — the pre-existing four never described a
 * buyer who simply never got the goods.
 */
function disputeRules() {
  const REASONS = [
    "Order Not Received",
    "Produce Grade Degradation",
    "Moisture Mismatch",
    "Delivery Transit Spoilage",
    "Weight Shortage",
    "Payment Delay",
  ];

  return [
    body("reason")
      .optional({ values: "falsy" })
      .isIn(REASONS)
      .withMessage("Unknown dispute reason"),

    body("note")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 500 })
      .withMessage("Note must be 500 characters or fewer"),
  ];
}

function demandRules() {
  return [
    body("product")
      .trim()
      .notEmpty()
      .withMessage("Product name is required")
      .isLength({ max: 120 })
      .withMessage("Product name must be 120 characters or fewer"),

    body("quantity")
      .exists()
      .withMessage("Quantity is required")
      .bail()
      .isFloat({ gt: 0 })
      .withMessage("Quantity must be greater than zero"),

    body("maxPricePerKgBdt")
      .optional({ values: "falsy" })
      .isFloat({ min: 0 })
      .withMessage("Budget must be zero or greater"),

    body("qualityGrade")
      .optional()
      .isIn(["Grade A", "Grade B", "Grade C", "Any"])
      .withMessage("Unknown quality grade"),

    body("deliveryMethod")
      .optional()
      .isIn(["pickup", "delivery"])
      .withMessage("Delivery method must be pickup or delivery"),

    body("deadline")
      .optional({ values: "falsy" })
      .isISO8601()
      .withMessage("Deadline must be a date"),
  ];
}

module.exports = { checkoutRules, disputeRules, demandRules, stripeCheckoutRules };

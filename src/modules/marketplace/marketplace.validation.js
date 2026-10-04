const { body, query } = require("express-validator");

const GRADES = ["Grade A", "Grade B", "Grade C"];

/**
 * Returns a FRESH set of chains every call.
 *
 * This must be a factory, not a shared array: `chain.optional()` mutates the
 * chain in place and returns the same instance, so deriving update rules with
 * `listingBodyRules.map(r => r.optional())` also made the *create* rules
 * optional. The result was a create endpoint that silently accepted a body
 * with no produceName and fell through to Mongoose's required-check, which
 * reports `{"message":["..."]}` instead of a clean string.
 */
function listingBodyRules() {
  return [
    body("produceName")
      .exists()
      .withMessage("Produce name is required")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("Produce name is required")
      .isLength({ max: 120 })
      .withMessage("Produce name must be 120 characters or fewer"),

    body("quantityAvailableKg")
      .optional({ values: "falsy" })
      .isFloat({ min: 0 })
      .withMessage("Quantity must be zero or greater"),

    body("askingPricePerKg")
      .optional({ values: "falsy" })
      .isFloat({ min: 0 })
      .withMessage("Price must be zero or greater"),

    body("minimumOrderKg")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Minimum order must be at least 1 kg"),

    body("qualityGrade")
      .optional()
      .isIn(GRADES)
      .withMessage(`Grade must be one of: ${GRADES.join(", ")}`),

    // Raw strings are accepted here; `marketplace.mappers.normalizeCategory`
    // folds admin-style prose ("Cereal Grains") onto the frontend's union.
    body("category")
      .optional({ values: "falsy" })
      .isString()
      .withMessage("Category must be a string"),

    body("imageUrl")
      .optional({ values: "falsy" })
      .isURL({ require_protocol: true, require_tld: false })
      .withMessage("Image URL must be a valid URL"),
  ];
}

exports.createListingValidation = listingBodyRules();

// `.optional()` on every rule: a partial PATCH must not require the full body.
exports.updateListingValidation = listingBodyRules().map((rule) => rule.optional());

exports.listListingsValidation = [
  query("category").optional().isString().withMessage("Category must be a string"),
  query("grade").optional().isIn(GRADES).withMessage("Unknown quality grade"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be zero or greater"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be zero or greater"),
];

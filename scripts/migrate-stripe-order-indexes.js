require("dotenv").config();
const mongoose = require("mongoose");

const SESSION_FIELD = "stripeSessionId";
const UNUSED_PAYMENT_INTENT_FIELD = "stripePaymentIntentId";

async function migrate() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "orders" }).toArray();

  if (!collections.length) {
    console.log("Orders collection does not exist; no indexes to migrate.");
    return;
  }

  const orders = db.collection("orders");
  const indexes = await orders.indexes();
  const legacyIndexes = indexes.filter((index) => {
    const fields = Object.keys(index.key || {});
    const isSingleSessionField =
      fields.length === 1 && fields[0] === SESSION_FIELD;
    const isSingleUnusedPaymentIntentField =
      fields.length === 1 && fields[0] === UNUSED_PAYMENT_INTENT_FIELD;

    return (
      isSingleUnusedPaymentIntentField ||
      (isSingleSessionField && index.unique === true)
    );
  });

  for (const index of legacyIndexes) {
    await orders.dropIndex(index.name);
    console.log(`Dropped incompatible index: ${index.name}`);
  }

  const refreshedIndexes = await orders.indexes();
  const hasSessionLookupIndex = refreshedIndexes.some(
    (index) =>
      index.unique !== true &&
      Object.keys(index.key || {}).length === 1 &&
      index.key[SESSION_FIELD] === 1
  );

  if (!hasSessionLookupIndex) {
    await orders.createIndex(
      { [SESSION_FIELD]: 1 },
      { name: `${SESSION_FIELD}_1` }
    );
    console.log(`Created non-unique lookup index: ${SESSION_FIELD}_1`);
  }
}

migrate()
  .catch((error) => {
    console.error("Stripe order index migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

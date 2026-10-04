require("dotenv").config();

const mongoose = require("mongoose");
const MarketplaceListing = require("../../database/models/MarketplaceListing");
const { listings } = require("./marketplace.data");

/**
 * Additive marketplace seeder — `npm run seed:marketplace`.
 *
 * Upserts each catalogue record by its natural key (`produceName`) and
 * touches NOTHING else. Unlike `npm run seed`, it does not wipe users,
 * orders, payments, notifications or crops, so it is safe to run against a
 * database you care about and can be re-run without harm: it only ever
 * inserts missing listings and refreshes the ones it owns.
 *
 * Listings created through the UI are left alone — they use different
 * produce names and therefore never match a key here.
 */
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected for marketplace seeding");
};

const run = async () => {
  try {
    await connectDB();

    let inserted = 0;
    let updated = 0;

    for (const record of listings) {
      // `id` is a readable seed key only; the schema has no `id` field.
      const { id, ...fields } = record;

      const result = await MarketplaceListing.updateOne(
        { produceName: record.produceName },
        { $set: fields },
        { upsert: true }
      );

      if (result.upsertedCount) inserted += 1;
      else updated += result.modifiedCount;
    }

    const total = await MarketplaceListing.countDocuments({});
    const approved = await MarketplaceListing.countDocuments({ status: "Approved" });

    console.log(`✓ Marketplace catalogue synced: ${inserted} inserted, ${updated} updated`);
    console.log(`  ${total} listings total, ${approved} approved for public browse`);

    process.exit(0);
  } catch (error) {
    console.error("Marketplace seeding failed:", error);
    process.exit(1);
  }
};

run();

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const DEMO_USERS = require("./demoUsers");

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    console.log("Clearing existing users...");
    await User.deleteMany({});

    console.log("Seeding demo users...");
    for (const userData of DEMO_USERS) {
      const user = await User.create(userData);
      console.log(`  Created: ${user.name} (${user.email}) — roles: [${user.roles.join(", ")}]`);
    }

    console.log("\nSeed complete! Demo accounts:");
    console.log("─────────────────────────────────────────────");
    DEMO_USERS.forEach((u) => {
      console.log(`  ${u.email.padEnd(28)} | ${u.password.padEnd(10)} | [${u.roles.join(", ")}]`);
    });
    console.log("─────────────────────────────────────────────");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();

const User = require("../models/User");
const DEMO_USERS = require("./demoUsers");

async function autoSeed() {
  try {
    const count = await User.countDocuments();

    if (count > 0) {
      console.log(`Database has ${count} users — skipping seed.`);
      return;
    }

    console.log("No users found — seeding demo accounts...");

    for (const userData of DEMO_USERS) {
      const user = await User.create(userData);
      console.log(`  Created: ${user.email} [${user.roles.join(", ")}]`);
    }

    console.log(`Seeded ${DEMO_USERS.length} demo users successfully.`);
  } catch (error) {
    console.error("Auto-seed failed:", error.message);
  }
}

module.exports = autoSeed;

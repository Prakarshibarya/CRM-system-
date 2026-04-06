// tests/setup-test-users.js
// Run with: node tests/setup-test-users.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Creating test users...\n");

  const hash = await bcrypt.hash("testpassword123", 12);
  const adminHash = await bcrypt.hash("adminpassword123", 12);

  await prisma.user.upsert({
    where: { email: "testuser@example.com" },
    update: { status: "approved", passwordHash: hash, sessionVersion: 0 },
    create: {
      email: "testuser@example.com",
      name: "Test User",
      passwordHash: hash,
      status: "approved",
      role: "user",
      sessionVersion: 0,
    },
  });
  console.log("✓ testuser@example.com / testpassword123  (approved, user)");

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { status: "approved", role: "admin", passwordHash: adminHash, sessionVersion: 0 },
    create: {
      email: "admin@example.com",
      name: "Admin User",
      passwordHash: adminHash,
      status: "approved",
      role: "admin",
      sessionVersion: 0,
    },
  });
  console.log("✓ admin@example.com / adminpassword123  (approved, admin)");

  await prisma.user.upsert({
    where: { email: "pending@example.com" },
    update: { status: "pending", passwordHash: hash, sessionVersion: 0 },
    create: {
      email: "pending@example.com",
      name: "Pending User",
      passwordHash: hash,
      status: "pending",
      role: "user",
      sessionVersion: 0,
    },
  });
  console.log("✓ pending@example.com / testpassword123  (pending — login should return 403)");

  console.log("\nDone. Now run the security tests.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
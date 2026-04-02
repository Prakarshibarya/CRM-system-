const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "prakarshi@highape.com"; // ← change this
  const password = "highape123";   // ← change this
  const name = "Admin";                    // ← change this

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      status: "approved",
      role: "admin",
    },
  });

  console.log(" Admin user created:", user.email);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
  })
  .finally(() => prisma.$disconnect());
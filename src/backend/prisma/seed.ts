import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

async function upsertUser(email: string, name: string, role: Role) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, passwordHash },
  });
}

async function main() {
  const requester = await upsertUser("requester@demo.test", "Riya Requester", Role.REQUESTER);
  const reviewer = await upsertUser("reviewer@demo.test", "Ravi Reviewer", Role.REVIEWER);
  await upsertUser("admin@demo.test", "Amara Admin", Role.ADMIN);

  console.log("Seeded demo accounts (all use password: %s):", DEMO_PASSWORD);
  console.log("  requester@demo.test / REQUESTER");
  console.log("  reviewer@demo.test  / REVIEWER");
  console.log("  admin@demo.test     / ADMIN");

  void requester;
  void reviewer;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Plans ─────────────────────────────────────────────────────────────────
  const plans = [
    {
      name: "Free",
      type: "FREE",
      description: "Perfect for getting started",
      price: 0,
      maxUsers: 1,
      maxProjects: 3,
      maxStorage: 512,
      maxApiCalls: 100,
      hasAnalytics: false,
      hasPrioritySupport: false,
      hasCustomDomain: false,
      hasTeamCollaboration: false,
    },
    {
      name: "Starter",
      type: "STARTER",
      description: "For small teams and growing businesses",
      price: 19,
      stripePriceId: process.env.STRIPE_PRICE_STARTER,
      maxUsers: 5,
      maxProjects: 20,
      maxStorage: 5120,
      maxApiCalls: 5000,
      hasAnalytics: true,
      hasPrioritySupport: false,
      hasCustomDomain: false,
      hasTeamCollaboration: true,
    },
    {
      name: "Pro",
      type: "PRO",
      description: "For professionals and larger teams",
      price: 49,
      stripePriceId: process.env.STRIPE_PRICE_PRO,
      maxUsers: 20,
      maxProjects: 100,
      maxStorage: 20480,
      maxApiCalls: 50000,
      hasAnalytics: true,
      hasPrioritySupport: true,
      hasCustomDomain: true,
      hasTeamCollaboration: true,
    },
    {
      name: "Enterprise",
      type: "ENTERPRISE",
      description: "For large organizations with custom needs",
      price: 199,
      stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
      maxUsers: 999,
      maxProjects: 9999,
      maxStorage: 102400,
      maxApiCalls: 1000000,
      hasAnalytics: true,
      hasPrioritySupport: true,
      hasCustomDomain: true,
      hasTeamCollaboration: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { type: plan.type },
      update: plan,
      create: plan,
    });
    console.log(`  ✅ Plan: ${plan.name}`);
  }

  // ─── Super Admin ───────────────────────────────────────────────────────────
  const adminEmail = "admin@saasapp.com";
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const hashed = await bcrypt.hash("Admin@123456", 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        firstName: "Super",
        lastName: "Admin",
        role: "SUPER_ADMIN",
        isEmailVerified: true,
      },
    });

    const freePlan = await prisma.plan.findUnique({ where: { type: "FREE" } });
    await prisma.subscription.create({
      data: {
        userId: admin.id,
        planId: freePlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
      },
    });

    console.log(`  ✅ Super Admin created: ${adminEmail} / Admin@123456`);
  } else {
    console.log(`  ℹ️  Super Admin already exists`);
  }

  console.log("\n🌱 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

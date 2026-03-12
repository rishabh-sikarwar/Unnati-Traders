// 1. Load the environment variables
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

// 2. Setup the Prisma 7 Postgres Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Bulk list of tyres extracted from the UT Tyre House document
const apolloTyres = [
  {
    sku: "APL-AMZ-145-80-R12",
    modelName: "AMAZER 4G LIVE",
    size: "145/80 R12",
    basePrice: 2200,
  },
  {
    sku: "APL-AMZ-155-80-R13",
    modelName: "AMAZER 4G LIVE",
    size: "155/80 R13",
    basePrice: 3000,
  },
  {
    sku: "APL-AMZ-165-70-R14",
    modelName: "AMAZER 4G LIVE",
    size: "165/70 R14",
    basePrice: 2800,
  },
  {
    sku: "APL-AMZ-165-80-R14",
    modelName: "AMAZER 4G LIVE",
    size: "165/80 R14",
    basePrice: 3000,
  },
  {
    sku: "APL-AMZ-185-65-R15",
    modelName: "AMAZER 4G LIVE",
    size: "185/65 R15",
    basePrice: 4325,
  },
  {
    sku: "APL-APT-215-75-R15",
    modelName: "APTERRA ST/ST2",
    size: "215/75 R15",
    basePrice: 4820,
  },
  {
    sku: "APL-AMZ-205-60-R15",
    modelName: "AMAZER 4G LIVE",
    size: "205/60 R15",
    basePrice: 4850,
  },
  {
    sku: "APL-AMZ-205-65-R16",
    modelName: "AMAZER 4G LIVE",
    size: "205/65 R16",
    basePrice: 4925,
  },
  {
    sku: "APL-ALN-195-55-R16",
    modelName: "ALNAC",
    size: "195/55 R16",
    basePrice: 5500,
  },
];

async function main() {
  console.log("🚀 Start seeding Apollo catalogue...");

  for (const tyre of apolloTyres) {
    const product = await prisma.product.upsert({
      where: { sku: tyre.sku },
      update: {
        basePrice: tyre.basePrice,
      },
      create: {
        sku: tyre.sku,
        modelName: tyre.modelName,
        size: tyre.size,
        basePrice: tyre.basePrice,
        brand: "Apollo",
        gstRate: 28,
      },
    });
    console.log(`✅ Added: ${product.sku} - ${product.modelName}`);
  }

  console.log("🎉 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

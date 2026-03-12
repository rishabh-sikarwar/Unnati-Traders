require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const businessLocations = [
  {
    name: "Main Distribution Warehouse",
    type: "warehouse",
    address: "Gwalior, Madhya Pradesh",
  },
  {
    name: "UT Tyre House",
    type: "retail_shop",
    address: "Bahodapur tiraha, Gwalior",
  },
  {
    name: "Unnati Traders - Showroom",
    type: "retail_shop",
    address: "Bhind Road, Gohad Chauraha",
  },
];

async function main() {
  console.log("🏢 Setting up business locations...");

  for (const loc of businessLocations) {
    // Check if it already exists to avoid duplicates
    const existing = await prisma.location.findFirst({
      where: { name: loc.name },
    });

    if (!existing) {
      await prisma.location.create({
        data: loc,
      });
      console.log(`✅ Created Location: ${loc.name}`);
    } else {
      console.log(`⏩ Location already exists: ${loc.name}`);
    }
  }

  console.log("🎉 Locations ready!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

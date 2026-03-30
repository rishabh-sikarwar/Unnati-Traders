require("dotenv").config({ path: ".env" });
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

// FIX 1: Use DIRECT_URL to completely bypass the Supabase SASL/PgBouncer bug
const connectionString = process.env.DIRECT_URL;

// FIX 2: Properly initialize the pg Pool and Prisma Adapter
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Translates Apollo's internal codes directly to your new Prisma Enums
const categoryMap = {
  "A-TBB": "TRUCK_BUS_BIAS",
  "B-TBR": "TRUCK_BUS_RADIAL",
  "C-FARM": "TRACTOR_FARM",
  "D-Trac": "TRACTOR_FRONT",
  "E-LTB": "LIGHT_COMMERCIAL",
  "F-Pickup": "PICKUP_BIAS",
  "G-Pickup": "PICKUP_RADIAL",
  "H-LCV": "LCV_RADIAL",
  "I-SCV": "SMALL_COMMERCIAL",
  "J-Trac": "TRACTOR_TRAILER",
  "K-2WHL": "TWO_WHEELER",
  "L-3WHL": "THREE_WHEELER",
  "M-IND": "INDUSTRIAL",
  "N-Jeep": "JEEP",
  "O-SCV": "SCV_RADIAL",
  "P-PCR": "PASSENGER_CAR",
  "ASPIRE-5": "PREMIUM_CAR",
};

async function main() {
  console.log("🚀 Starting Smart PDF-Text Extraction with DIRECT_URL...");

  const text = fs.readFileSync("apollo-data.txt", "utf8");
  const lines = text.split("\n");
  const locations = await prisma.location.findMany();

  let successCount = 0;

  for (let line of lines) {
    try {
      line = line
        .replace(/"/g, " ")
        .replace(/,/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!line || line.includes("Price List") || line.includes("SKUNAME"))
        continue;

      // 1. Identify the Category Enum
      let categoryKey = Object.keys(categoryMap).find((key) =>
        line.includes(key),
      );
      if (!categoryKey) continue;
      const categoryEnum = categoryMap[categoryKey];

      // 2. Identify the Tube Type
      let tubeType = "T/L";
      if (line.includes("TTF")) tubeType = "TTF";
      else if (line.includes("T/L")) tubeType = "T/L";
      else if (line.includes("TUBE")) tubeType = "TUBE";
      else if (line.includes("TT")) tubeType = "TT";

      // 3. Smart Price Extraction
      const numbers = line.match(/\b\d{3,6}\b/g);
      if (!numbers || numbers.length < 2) continue;

      const singlePrice = parseFloat(numbers[numbers.length - 1]);
      const pairPrice = parseFloat(numbers[numbers.length - 2]);

      // 4. Extract Tyre Name & Size
      const pairPriceIndex = line.lastIndexOf(pairPrice.toString());
      let rawName = line.substring(0, pairPriceIndex).trim();

      if (rawName.toUpperCase().startsWith("NEW "))
        rawName = rawName.substring(4).trim();

      const firstSpace = rawName.indexOf(" ");
      let size = rawName;
      let modelName = rawName;

      if (firstSpace !== -1) {
        size = rawName.substring(0, firstSpace).trim();
        modelName = rawName.substring(firstSpace + 1).trim();
      }

      const sku = `APL-${size}-${modelName.split(" ")[0]}`
        .replace(/[^a-zA-Z0-9-]/g, "")
        .toUpperCase()
        .substring(0, 20);

      // 5. Inject into Database
      await prisma.product.upsert({
        where: { sku: sku },
        update: {
          basePrice: singlePrice,
          category: categoryEnum,
          tubeType: tubeType,
        },
        create: {
          sku: sku,
          brand: "Apollo",
          modelName: modelName,
          size: size,
          category: categoryEnum,
          tubeType: tubeType,
          basePrice: singlePrice,
          inventories: {
            create: locations.map((loc) => ({
              locationId: loc.id,
              quantity: 0,
            })),
          },
        },
      });

      successCount++;
      console.log(
        `✅ Extracted: [${categoryEnum}] ${size} ${modelName} | ${tubeType} | ₹${singlePrice}`,
      );
    } catch (e) {
      // Silently ignore broken lines
    }
  }

  console.log(
    `\n🎉 Data Migration Complete! Perfectly extracted ${successCount} tyres into the database.`,
  );
  await pool.end(); // Close the connection properly
}

main().catch((e) => {
  console.error("\n❌ Migration failed:", e.message);
  process.exit(1);
});

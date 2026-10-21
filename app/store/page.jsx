import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StoreCatalogueClient from "@/components/store/StoreCatalogueClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "B2B Tyre Catalogue & Booking | Unnati Traders",
  description: "Wholesale tyre inventory booking for dealers and businesses in Bhind district.",
};

export default async function StorePage({ searchParams }) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  let dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser) {
    redirect("/api/auth/sync");
  }

  // Find linked customer profile to verify phone number
  const customer = await prisma.customer.findUnique({
    where: { clerkUserId: clerkUser.id },
  });

  const currentPhone = dbUser.mobile || customer?.phone || "";

  // Fetch all shops/locations
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      address: true,
    },
  });

  // Extract search query from URL searchParams if provided
  const resolvedParams = searchParams ? await searchParams : {};
  const searchQuery = (resolvedParams?.search || resolvedParams?.q || "").trim();

  // Build case-insensitive multi-field OR query
  const whereClause = {
    isArchived: false,
  };

  if (searchQuery) {
    whereClause.OR = [
      { modelName: { contains: searchQuery, mode: "insensitive" } },
      { size: { contains: searchQuery, mode: "insensitive" } },
      { brand: { contains: searchQuery, mode: "insensitive" } },
      { sku: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Fetch all active matching products
  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: [
      { brand: "asc" },
      { modelName: "asc" },
    ],
  });

  // STRICT PRICING & INVENTORY PRIVACY:
  // Do NOT include basePrice or internal inventory levels in customer-facing catalogue.
  const serializedProducts = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    brand: p.brand,
    name: p.modelName,
    model: p.modelName,
    modelName: p.modelName,
    size: p.size,
    category: p.category,
    tubeType: p.tubeType,
    description: p.description,
  }));

  return (
    <StoreCatalogueClient
      user={{
        id: dbUser.id,
        fullName: dbUser.fullName,
        email: dbUser.email,
        role: dbUser.role,
      }}
      locations={locations}
      products={serializedProducts}
      initialPhone={currentPhone}
      initialSearch={searchQuery}
    />
  );
}

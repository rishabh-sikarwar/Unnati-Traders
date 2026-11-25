import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PurchasesPageClient from "@/components/purchases/purchases-page-client";

export const dynamic = "force-dynamic";

export default async function PurchasesPage({ searchParams }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER"))
    redirect("/");

  const queries = await searchParams;
  const initialTab = queries?.tab === "transfers" ? "transfers" : "supplier";

  // Fetch the master catalogue so Smart Search works
  const products = await prisma.product.findMany({
    select: {
      id: true,
      modelName: true,
      size: true,
      sku: true,
      basePrice: true,
      hasTube: true,
      tubeName: true,
      tubePrice: true,
      hasFlap: true,
      flapName: true,
      flapPrice: true,
    },
    orderBy: { modelName: "asc" },
  });

  const serializedProducts = products.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
    tubePrice: Number(p.tubePrice || 0),
    flapPrice: Number(p.flapPrice || 0),
  }));

  // Fetch active shops to determine where stock unloads
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch all Valued Stock Transfers with items and products
  const stockTransfers = await prisma.stockTransfer.findMany({
    include: {
      fromLocation: { select: { id: true, name: true } },
      toLocation: { select: { id: true, name: true } },
      user: { select: { fullName: true, email: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              modelName: true,
              size: true,
              sku: true,
              hsnCode: true,
              hasTube: true,
              tubeName: true,
              hasFlap: true,
              flapName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedTransfers = stockTransfers.map((t) => ({
    ...t,
    totalWorth: Number(t.totalWorth),
    items: t.items.map((it) => ({
      ...it,
      unitPrice: Number(it.unitPrice),
      totalValue: Number(it.totalValue),
    })),
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
        <PurchasesPageClient
          products={serializedProducts}
          locations={locations}
          userId={dbUser.id}
          userRole={dbUser.role}
          userLocationId={dbUser.locationId}
          transfers={serializedTransfers}
          initialTab={initialTab}
        />
      </div>
    </div>
  );
}

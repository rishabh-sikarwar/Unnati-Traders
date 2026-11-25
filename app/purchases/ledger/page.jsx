import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import PurchaseLedgerClient from "@/components/purchases/purchase-ledger-client";

export const dynamic = "force-dynamic";

export default async function PurchaseLedgerPage({ searchParams }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER")) {
    redirect("/dashboard");
  }

  if (dbUser.role === "SHOPKEEPER" && !dbUser.locationId) {
    redirect("/dashboard");
  }

  const queries = await searchParams;
  const initialTab = queries?.tab === "transfers" ? "transfers" : "supplier";

  const showShopFilter = dbUser.role === "ADMIN";

  const locations = showShopFilter
    ? await prisma.location.findMany({
        orderBy: { name: "asc" },
      })
    : [];

  // Fetch all purchases with their related items, locations, and the user who logged them
  const purchases = await prisma.purchase.findMany({
    where:
      dbUser.role === "SHOPKEEPER"
        ? {
            items: { some: {} },
            locationId: dbUser.locationId,
          }
        : {
            items: { some: {} },
          },
    include: {
      location: true,
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedPurchases = purchases.map((purchase) => ({
    ...purchase,
    totalAmount: Number(purchase.totalAmount),
    items: purchase.items.map((item) => ({
      ...item,
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      tubePrice: Number(item.tubePrice || 0),
      flapPrice: Number(item.flapPrice || 0),
      product: {
        ...item.product,
        basePrice: Number(item.product.basePrice),
        tubePrice: Number(item.product.tubePrice || 0),
        flapPrice: Number(item.product.flapPrice || 0),
      },
    })),
  }));

  // Fetch all Valued Stock Transfers
  const stockTransfers = await prisma.stockTransfer.findMany({
    where:
      dbUser.role === "SHOPKEEPER"
        ? {
            OR: [
              { toLocationId: dbUser.locationId },
              { fromLocationId: dbUser.locationId },
            ],
          }
        : {},
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
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-6 animate-in fade-in duration-500">
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-[#522874] rounded-lg">
              <Truck className="w-6 h-6" />
            </div>
            Inward Stock & Purchase Ledger
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Complete record of supplier purchase invoices from Apollo and valued
            internal stock transfers received across shops.
          </p>
        </div>

        <PurchaseLedgerClient
          purchases={serializedPurchases}
          locations={locations}
          userRole={dbUser.role}
          showShopFilter={showShopFilter}
          transfers={serializedTransfers}
          initialTab={initialTab}
        />
      </div>
    </div>
  );
}

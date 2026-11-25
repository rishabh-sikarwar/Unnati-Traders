import { prisma } from "@/lib/prisma";
import TransferStockForm from "@/components/admin/transfer-stock-form";
import BranchTransfersView from "@/components/admin/branch-transfers-view";
import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TransferPage() {
  // CRITICAL: Include inventories & latest purchase item to compute last purchase cost (including TTF sets)
  const products = await prisma.product.findMany({
    include: {
      inventories: true,
      purchaseItems: {
        orderBy: { purchase: { purchaseDate: "desc" } },
        take: 1,
        select: {
          unitCost: true,
          includeTube: true,
          tubePrice: true,
          includeFlap: true,
          flapPrice: true,
        },
      },
    },
    orderBy: { modelName: "asc" },
  });

  const serializedProducts = products.map((p) => {
    const latestPurchase = p.purchaseItems?.[0];
    let lastPurchaseRate = 0;
    if (latestPurchase) {
      lastPurchaseRate =
        Number(latestPurchase.unitCost || 0) +
        (latestPurchase.includeTube ? Number(latestPurchase.tubePrice || 0) : 0) +
        (latestPurchase.includeFlap ? Number(latestPurchase.flapPrice || 0) : 0);
    } else {
      lastPurchaseRate =
        Number(p.basePrice || 0) +
        (p.hasTube ? Number(p.tubePrice || 0) : 0) +
        (p.hasFlap ? Number(p.flapPrice || 0) : 0);
    }

    return {
      id: p.id,
      modelName: p.modelName,
      size: p.size,
      sku: p.sku,
      brand: p.brand,
      hsnCode: p.hsnCode,
      basePrice: Number(p.basePrice),
      tubePrice: Number(p.tubePrice || 0),
      flapPrice: Number(p.flapPrice || 0),
      hasTube: p.hasTube,
      tubeName: p.tubeName,
      hasFlap: p.hasFlap,
      flapName: p.flapName,
      lastPurchaseRate: Math.round(lastPurchaseRate * 100) / 100,
      inventories: p.inventories,
    };
  });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch all Valued Stock Transfers with their items & branch locations
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-24 md:pt-36 lg:pt-28 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* --- HEADER --- */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#522874] mb-4 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-[#522874] rounded-xl">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            Transfer Stock & Valuation
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Move commercial inventory between Shop A and Shop B with auto-fetched
            Apollo purchase rates, live worth calculation, and delivery challans.
          </p>
        </div>

        {/* --- TRANSFER FORM --- */}
        <TransferStockForm
          products={serializedProducts}
          locations={locations}
        />

        {/* --- VALUED STOCK TRANSFERS HISTORY & SUMMARY --- */}
        <div className="pt-4 border-t border-gray-200">
          <BranchTransfersView
            transfers={serializedTransfers}
            locations={locations}
            title="Internal Stock Transfer History & Challans"
            description="Complete log of valued stock dispatches with live valuation and printable delivery challans."
          />
        </div>
      </div>
    </div>
  );
}

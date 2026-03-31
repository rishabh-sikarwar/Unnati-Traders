import { prisma } from "@/lib/prisma";
import TransferStockForm from "@/components/admin/transfer-stock-form";
import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TransferPage() {
  // CRITICAL: Included inventories so the client form knows the current stock levels!
  const products = await prisma.product.findMany({
    include: { inventories: true },
    orderBy: { modelName: "asc" },
  });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 pt-24 md:pt-32">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#522874] mb-4 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="text-[#522874] h-8 w-8" />
            Transfer Stock
          </h1>
          <p className="text-gray-500 mt-1">
            Move inventory securely between warehouses and retail shops.
          </p>
        </div>

        <TransferStockForm products={products} locations={locations} />
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { Package, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import InventoryTable from "@/components/inventory/InventoryTable";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: { inventories: true },
    orderBy: { modelName: "asc" },
  });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 md:px-8 pb-8 pt-20 md:pt-36 lg:pt-28 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-[#522874] h-8 w-8" />
              Inventory Hub
            </h1>
            <p className="text-gray-500 mt-1">
              Live physical stock levels across all locations.
            </p>
          </div>

          <div className="flex w-full md:w-auto">
            <Link
              href="/admin/transfer"
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#522874] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-[#3d1d56] transition-all shadow-sm active:scale-95"
            >
              <ArrowRightLeft size={18} /> Transfer Stock
            </Link>
          </div>
        </div>

        <InventoryTable products={products} locations={locations} />
      </div>
    </div>
  );
}

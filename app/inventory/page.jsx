import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRightLeft, PlusSquare, Package } from "lucide-react";
import InventoryTable from "./InventoryTable"; 

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  // Fetch products and their nested inventory counts
  const products = await prisma.product.findMany({
    include: { inventories: true },
    orderBy: { modelName: "asc" },
  });

  // Fetch locations for the filter dropdown
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-6 md:px-8 pb-8 pt-28 md:pt-32 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header & Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-[#522874] h-8 w-8" />
              Inventory Hub
            </h1>
            <p className="text-gray-500 mt-1">
              Aggregate stock levels and shop filters.
            </p>
          </div>

          <div className="flex gap-3">
            {/* New Manage Stock Button */}
            <Link
              href="/inventory/manage"
              className="flex items-center gap-2 bg-[#522874] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-[#3d1d56] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <PlusSquare size={18} />
              Manage Stock
            </Link>

            {/* Existing Transfer Button */}
            <Link
              href="/admin/transfer"
              className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowRightLeft size={18} className="text-orange-600" />
              Transfer Stock
            </Link>
          </div>
        </div>

        {/* The Clean Interactive Spreadsheet */}
        <InventoryTable products={products} locations={locations} />
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import UpdateStock from "@/components/inventory/update-stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowRightLeft, History } from "lucide-react";
import Link from "next/link";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: {
      inventories: {
        include: { location: true },
      },
    },
    orderBy: { modelName: "asc" },
  });

  return (
    <div className="px-6 md:px-8 pb-8 pt-32 md:pt-36 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Inventory Hub
            </h1>
            <p className="text-gray-500 mt-1">
              Real-time stock levels across all Apollo locations.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/transfer"
              className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-all cursor-pointer"
            >
              <ArrowRightLeft size={18} className="text-orange-600" />
              Transfer Stock
            </Link>
          </div>
        </div>

        {/* Inventory Matrix Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-6 text-sm font-black text-gray-400 uppercase tracking-widest">
                  Tyre Details
                </th>
                <th className="p-6 text-sm font-black text-gray-400 uppercase tracking-widest">
                  Stock by Location
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-purple-50/20 transition-colors"
                >
                  <td className="p-6 w-1/3">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-gray-900 leading-tight">
                        {product.modelName}
                      </span>
                      <span className="text-sm font-bold text-purple-600 mt-1">
                        {product.size}
                      </span>
                      <code className="text-[10px] text-gray-400 mt-2 uppercase tracking-tighter">
                        SKU: {product.sku}
                      </code>
                    </div>
                  </td>

                  <td className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.inventories.map((inv) => (
                        <div
                          key={inv.id}
                          className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-gray-500 uppercase">
                              {inv.location.name}
                            </span>
                            <Badge
                              className={`${inv.quantity <= product.lowStock ? "bg-red-500" : "bg-[#522874]"} text-white font-black`}
                            >
                              {inv.quantity} IN STOCK
                            </Badge>
                          </div>
                          <UpdateStock
                            productId={product.id}
                            locationId={inv.locationId}
                            currentQty={inv.quantity}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

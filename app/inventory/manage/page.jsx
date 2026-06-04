import { prisma } from "@/lib/prisma";
import ManageStockForm from "@/components/inventory/manage-stock-form";
import { ArrowLeft, PlusSquare, History } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ManageStockPage() {
  // Include inventories so the client form knows the current stock levels!
  const products = await prisma.product.findMany({
    include: { inventories: true },
    orderBy: { modelName: "asc" },
  });

  const serializedProducts = products.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
  }));

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch the last 50 StockAdjustmentLog records sorted by createdAt descending
  const adjustmentLogs = await prisma.stockAdjustmentLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      location: true,
      user: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 pt-28 md:pt-32">
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#522874] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <PlusSquare className="text-[#522874] h-8 w-8" />
            Update Shop Stock
          </h1>
          <p className="text-gray-500 mt-1">
            Add newly arrived tyres or adjust stock counts for a specific
            location.
          </p>
        </div>

        <ManageStockForm products={serializedProducts} locations={locations} />

        {/* Recent Adjustments History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <History className="text-[#522874] h-6 w-6" />
            <h2 className="text-xl font-bold text-gray-900">Recent Adjustments History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tyre Details</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Adjustment</th>
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adjustmentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                      No adjustments logged yet.
                    </td>
                  </tr>
                ) : (
                  adjustmentLogs.map((log) => {
                    const isAdd = log.quantityChange > 0;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                        <td className="p-3 text-gray-600 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="p-3 font-semibold text-gray-800">
                          {log.product.modelName} <span className="text-[#522874] font-medium">({log.product.size})</span>
                          <span className="block text-[10px] text-gray-400 font-mono">SKU: {log.product.sku}</span>
                        </td>
                        <td className="p-3 text-gray-600">
                          <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded uppercase">
                            {log.location.name}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-black ${isAdd ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            {isAdd ? `+${log.quantityChange}` : `${log.quantityChange}`}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">
                          {log.user.fullName || log.user.email || "System"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

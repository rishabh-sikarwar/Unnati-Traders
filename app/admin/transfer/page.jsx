import { prisma } from "@/lib/prisma";
import TransferStockForm from "@/components/admin/transfer-stock-form";
import { ArrowLeftRight, Clock3, Search, Filter } from "lucide-react";
import Link from "next/link";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
} from "date-fns";

export const dynamic = "force-dynamic";

export default async function TransferPage({ searchParams }) {
  // CRITICAL: Included inventories so the client form knows the current stock levels!
  const products = await prisma.product.findMany({
    include: { inventories: true },
    orderBy: { modelName: "asc" },
  });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  const queries = await searchParams;
  const searchQuery = (queries?.search || "").trim();
  const dateFilter = queries?.date || "this_month";
  const customStart = queries?.start;
  const customEnd = queries?.end;

  let cutoffStart = null;
  let cutoffEnd = null;
  const now = new Date();

  if (dateFilter === "today") {
    cutoffStart = startOfDay(now);
    cutoffEnd = endOfDay(now);
  } else if (dateFilter === "last_7") {
    cutoffStart = startOfDay(subDays(now, 6));
    cutoffEnd = endOfDay(now);
  } else if (dateFilter === "this_month") {
    cutoffStart = startOfMonth(now);
    cutoffEnd = endOfMonth(now);
  } else if (dateFilter === "custom" && customStart && customEnd) {
    cutoffStart = startOfDay(new Date(customStart));
    cutoffEnd = endOfDay(new Date(customEnd));
  }

  const transferWhere = {};

  if (cutoffStart && cutoffEnd) {
    transferWhere.createdAt = { gte: cutoffStart, lte: cutoffEnd };
  }

  if (searchQuery) {
    transferWhere.OR = [
      {
        product: {
          modelName: { contains: searchQuery, mode: "insensitive" },
        },
      },
      {
        product: {
          sku: { contains: searchQuery, mode: "insensitive" },
        },
      },
      {
        product: {
          hsnCode: { contains: searchQuery, mode: "insensitive" },
        },
      },
      {
        fromLocation: {
          name: { contains: searchQuery, mode: "insensitive" },
        },
      },
      {
        toLocation: {
          name: { contains: searchQuery, mode: "insensitive" },
        },
      },
      {
        user: {
          fullName: { contains: searchQuery, mode: "insensitive" },
        },
      },
    ];
  }

  const transferLogs = await prisma.transferLog.findMany({
    where: transferWhere,
    include: {
      product: {
        select: { modelName: true, size: true, sku: true, hsnCode: true },
      },
      fromLocation: { select: { name: true } },
      toLocation: { select: { name: true } },
      user: { select: { fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 pt-20 md:pt-36 lg:pt-28">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-[#522874]" />
              <h2 className="text-lg font-bold text-gray-900">
                Transfer History
              </h2>
            </div>

            <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="Search tyre name, SKU, HSN, or shop..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  name="date"
                  defaultValue={dateFilter}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white cursor-pointer"
                >
                  <option value="this_month">This Month</option>
                  <option value="today">Today</option>
                  <option value="last_7">Last 7 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 md:col-span-4">
                <input
                  type="date"
                  name="start"
                  defaultValue={customStart || ""}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white"
                />
                <input
                  type="date"
                  name="end"
                  defaultValue={customEnd || ""}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white"
                />
              </div>

              <div className="md:col-span-4 flex justify-end gap-2">
                <Link
                  href="/admin/transfer"
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Reset
                </Link>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-[#522874] text-white font-bold hover:bg-[#3d1d56] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3 px-5 font-bold">Date</th>
                  <th className="py-3 px-5 font-bold">Product</th>
                  <th className="py-3 px-5 font-bold">HSN</th>
                  <th className="py-3 px-5 font-bold">From</th>
                  <th className="py-3 px-5 font-bold">To</th>
                  <th className="py-3 px-5 font-bold text-center">Qty</th>
                  <th className="py-3 px-5 font-bold">Moved By</th>
                </tr>
              </thead>
              <tbody>
                {transferLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 px-5 text-center text-gray-400 font-medium">
                      No transfer history found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  transferLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors">
                      <td className="py-4 px-5 text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900">{log.product.modelName}</div>
                        <div className="text-xs text-gray-500">{log.product.size} • SKU: {log.product.sku}</div>
                      </td>
                      <td className="py-4 px-5 text-sm font-semibold text-gray-700">{log.product.hsnCode || "4011"}</td>
                      <td className="py-4 px-5 text-sm text-gray-700">{log.fromLocation.name}</td>
                      <td className="py-4 px-5 text-sm text-gray-700">{log.toLocation.name}</td>
                      <td className="py-4 px-5 text-center font-black text-[#522874]">{log.quantity}</td>
                      <td className="py-4 px-5 text-sm text-gray-700">{log.user?.fullName || log.user?.email || "System"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

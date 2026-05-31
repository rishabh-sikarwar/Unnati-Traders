import { prisma } from "@/lib/prisma";
import TransferStockForm from "@/components/admin/transfer-stock-form";
import {
  ArrowLeftRight,
  Clock3,
  Search,
  Filter,
  ArrowRight,
  Package,
  CalendarDays,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
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
        product: { modelName: { contains: searchQuery, mode: "insensitive" } },
      },
      { product: { sku: { contains: searchQuery, mode: "insensitive" } } },
      { product: { hsnCode: { contains: searchQuery, mode: "insensitive" } } },
      {
        fromLocation: { name: { contains: searchQuery, mode: "insensitive" } },
      },
      { toLocation: { name: { contains: searchQuery, mode: "insensitive" } } },
      { user: { fullName: { contains: searchQuery, mode: "insensitive" } } },
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pt-24 md:pt-36 lg:pt-28 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* --- HEADER --- */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#522874] mb-4 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-[#522874] rounded-lg">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            Transfer Stock
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Move inventory securely between warehouses and retail shops.
          </p>
        </div>

        {/* --- TRANSFER FORM --- */}
        <TransferStockForm products={products} locations={locations} />

        {/* --- HISTORY SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
          {/* Section Title */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-2 bg-white">
            <Clock3 className="w-5 h-5 text-[#522874]" />
            <h2 className="text-xl font-black text-gray-900">
              Transfer History
            </h2>
          </div>

          {/* Sleek SaaS Filter Toolbar */}
          <div className="bg-gray-50/50 p-4 border-b border-gray-200">
            <form method="get" className="flex flex-col lg:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="Search tyre name, SKU, shop, or user..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none bg-white font-medium text-sm transition-all shadow-sm"
                />
              </div>

              {/* Filters & Actions Group */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                <div className="relative w-full md:w-48">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    name="date"
                    defaultValue={dateFilter}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none bg-white cursor-pointer text-sm font-bold text-gray-700 shadow-sm appearance-none"
                  >
                    <option value="this_month">This Month</option>
                    <option value="today">Today</option>
                    <option value="last_7">Last 7 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Show custom dates if selected */}
                {dateFilter === "custom" && (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                    <input
                      type="date"
                      name="start"
                      defaultValue={customStart || ""}
                      className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium outline-none shadow-sm"
                    />
                    <span className="text-gray-400 font-medium">to</span>
                    <input
                      type="date"
                      name="end"
                      defaultValue={customEnd || ""}
                      className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium outline-none shadow-sm"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    type="submit"
                    className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#522874] text-white font-bold hover:bg-[#3d1d56] transition-all shadow-sm active:scale-95 text-sm"
                  >
                    Apply
                  </button>
                  <Link
                    href="/admin/transfer"
                    className="flex items-center justify-center p-2.5 rounded-xl border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all shadow-sm active:scale-95 bg-white"
                    title="Reset Filters"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {/* Premium Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead className="bg-white border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-4 px-6 font-black">Date & Time</th>
                  <th className="py-4 px-6 font-black">Tyre Details</th>
                  <th className="py-4 px-6 font-black text-center">
                    Qty Moved
                  </th>
                  <th className="py-4 px-6 font-black">Transfer Route</th>
                  <th className="py-4 px-6 font-black">Moved By</th>
                </tr>
              </thead>
              <tbody>
                {transferLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 px-6 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ArrowLeftRight className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-bold text-gray-700 text-lg">
                        No transfers found
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Try adjusting your filters or search query.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transferLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">
                          {format(new Date(log.createdAt), "dd MMM yyyy")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(log.createdAt), "hh:mm a")}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-4 px-6">
                        <div className="font-black text-[#522874] flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-purple-400" />
                          {log.product.modelName}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 font-semibold flex items-center gap-2">
                          <span>{log.product.size}</span>
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            HSN: {log.product.hsnCode || "4011"}
                          </span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-3.5 py-1 bg-orange-50 text-orange-600 rounded-lg font-black text-sm border border-orange-200 shadow-sm">
                          {log.quantity}
                        </span>
                      </td>

                      {/* Visual Route */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold">
                          <span className="text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 shadow-sm truncate max-w-[120px]">
                            {log.fromLocation.name}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200 shadow-sm truncate max-w-[120px]">
                            {log.toLocation.name}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-gray-800">
                          {log.user?.fullName || "Admin"}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {log.user?.email || "System generated"}
                        </div>
                      </td>
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

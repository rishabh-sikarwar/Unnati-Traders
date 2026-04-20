"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Printer, FileText, Loader2, Filter } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";

export default function OrdersTable({
  initialOrders,
  userRole,
  locations = [],
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingOrderId, setLoadingOrderId] = useState(null);

  // New Filter States
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, 7, 30, 90
  const [shopFilter, setShopFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, B2B, B2C

  const filteredOrders = useMemo(() => {
    const now = new Date();

    return initialOrders.filter((order) => {
      // 1. Text Search
      const query = searchQuery.toLowerCase();
      const invMatch = order.invoiceNumber.toLowerCase().includes(query);
      const nameMatch = order.customer?.name?.toLowerCase().includes(query);
      const phoneMatch = order.customer?.phone?.toLowerCase().includes(query);
      if (searchQuery && !invMatch && !nameMatch && !phoneMatch) return false;

      // 2. Date Filter
      if (dateFilter !== "ALL") {
        const cutoffDate = subDays(now, parseInt(dateFilter));
        if (!isAfter(new Date(order.createdAt), cutoffDate)) return false;
      }

      // 3. Shop Filter (Only applicable if Admin)
      if (userRole === "ADMIN" && shopFilter !== "ALL") {
        if (order.locationId !== shopFilter) return false;
      }

      // 4. B2B / Retail Filter
      if (typeFilter !== "ALL") {
        const isB2B =
          order.customer?.type === "SUB_DEALER" ||
          order.customer?.type === "DISTRIBUTOR";
        if (typeFilter === "B2B" && !isB2B) return false;
        if (typeFilter === "B2C" && isB2B) return false;
      }

      return true;
    });
  }, [
    initialOrders,
    searchQuery,
    dateFilter,
    shopFilter,
    typeFilter,
    userRole,
  ]);

  return (
    <div className="space-y-6">
      {/* TOOLBAR: SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Invoice, Customer, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#522874] transition-all font-medium text-gray-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-gray-400 font-bold text-xs uppercase tracking-widest pl-2">
            <Filter className="w-4 h-4" /> Filters:
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
          >
            <option value="ALL">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
          >
            <option value="ALL">All Sales (B2B + B2C)</option>
            <option value="B2B">B2B (Dealers Only)</option>
            <option value="B2C">B2C (Retail Only)</option>
          </select>

          {userRole === "ADMIN" && locations.length > 0 && (
            <select
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
            >
              <option value="ALL">All Shops</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* MOBILE-RESPONSIVE ORDERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          {/* Desktop Header */}
          <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Invoice Details
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              {userRole === "ADMIN" && (
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
              )}
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Grand Total
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            {filteredOrders.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan={userRole === "ADMIN" ? 6 : 5}
                  className="block md:table-cell p-10 text-center text-gray-500"
                >
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold text-gray-700 text-lg">
                    No invoices match your filters.
                  </p>
                  <p className="text-sm mt-1">
                    Try adjusting your search or date range.
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="block md:table-row border-b border-gray-100 hover:bg-purple-50/20 transition-colors p-4 md:p-0"
                >
                  {/* DATE */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Date:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-gray-800">
                          {format(new Date(order.createdAt), "dd MMM yyyy")}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                          {format(new Date(order.createdAt), "hh:mm a")}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* INVOICE INFO */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Invoice:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-black text-[#522874]">
                          {order.invoiceNumber}
                        </div>
                        <div className="text-xs text-gray-500 font-bold mt-0.5 bg-gray-100 w-fit px-2 py-0.5 rounded">
                          {order._count?.items || 0} Items
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Customer:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-gray-900">
                          {order.customer?.name || "Walk-in Customer"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {order.customer?.phone || "No Phone"}
                        </div>
                        {(order.customer?.type === "SUB_DEALER" ||
                          order.customer?.type === "DISTRIBUTOR") && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black rounded uppercase tracking-wider">
                            B2B DEALER
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SHOP (Admins Only) */}
                  {userRole === "ADMIN" && (
                    <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                      <div className="flex justify-between md:block items-center">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                          Shop:
                        </span>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded uppercase tracking-wide">
                          {order.location?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* TOTAL */}
                  <td className="block md:table-cell md:p-4 md:text-right mb-4 md:mb-0 bg-gray-50 md:bg-transparent rounded-lg p-3 md:p-0">
                    <div className="flex justify-between md:justify-end items-center">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                        Grand Total:
                      </span>
                      <div className="text-lg md:text-xl font-black text-green-600">
                        ₹
                        {order.grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="block md:table-cell md:p-4 md:text-right border-t md:border-none pt-4 md:pt-0">
                    <Link
                      href={`/billing/receipt/${order.id}`}
                      onClick={() => setLoadingOrderId(order.id)}
                      className="flex items-center justify-center md:justify-end gap-1.5 bg-[#522874] hover:bg-[#3d1d56] text-white px-3 py-2.5 md:py-2 rounded-lg text-sm font-bold transition-colors shadow-sm active:scale-95 w-full md:w-auto"
                    >
                      {loadingOrderId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                      {loadingOrderId === order.id
                        ? "Loading..."
                        : "View Receipt"}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

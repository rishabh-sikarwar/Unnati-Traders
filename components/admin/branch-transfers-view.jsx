"use client";

import { useState, useMemo } from "react";
import { format, isToday, startOfDay, endOfDay, subDays, isAfter, isWithinInterval } from "date-fns";
import {
  ArrowLeftRight,
  Truck,
  Building2,
  CalendarDays,
  Search,
  Filter,
  Printer,
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  FileText,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/format";
import TransferChallanModal from "@/components/admin/transfer-challan-modal";

export default function BranchTransfersView({
  transfers = [],
  locations = [],
  title = "Branch Stock Transfers",
  description = "Track exact valuation of tyres moved between Shop A and Shop B without duplicate supplier bills.",
  defaultDestinationId = "ALL",
  userRole = "ADMIN",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("THIS_MONTH");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [destinationFilter, setDestinationFilter] = useState(defaultDestinationId);
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [selectedTransferForChallan, setSelectedTransferForChallan] = useState(null);

  // Filtered Transfers
  const filteredTransfers = useMemo(() => {
    const now = new Date();

    return transfers.filter((t) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = t.transferNumber?.toLowerCase().includes(q);
        const fromMatch = t.fromLocation?.name?.toLowerCase().includes(q);
        const toMatch = t.toLocation?.name?.toLowerCase().includes(q);
        const userMatch = t.user?.fullName?.toLowerCase().includes(q) || t.user?.email?.toLowerCase().includes(q);
        const notesMatch = t.notes?.toLowerCase().includes(q);
        const itemMatch = t.items?.some(
          (it) =>
            it.product?.modelName?.toLowerCase().includes(q) ||
            it.product?.sku?.toLowerCase().includes(q) ||
            it.product?.size?.toLowerCase().includes(q)
        );

        if (!numMatch && !fromMatch && !toMatch && !userMatch && !notesMatch && !itemMatch) {
          return false;
        }
      }

      // 2. Destination filter
      if (destinationFilter !== "ALL" && t.toLocationId !== destinationFilter) {
        return false;
      }

      // 3. Source filter
      if (sourceFilter !== "ALL" && t.fromLocationId !== sourceFilter) {
        return false;
      }

      // 4. Date filter
      const tDate = new Date(t.createdAt);
      if (dateFilter === "TODAY") {
        if (!isToday(tDate)) return false;
      } else if (dateFilter === "LAST_7") {
        const cutoff = startOfDay(subDays(now, 6));
        if (!isAfter(tDate, cutoff)) return false;
      } else if (dateFilter === "THIS_MONTH") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (tDate < startOfMonth) return false;
      } else if (dateFilter === "CUSTOM") {
        if (customStart && customEnd) {
          const s = startOfDay(new Date(customStart));
          const e = endOfDay(new Date(customEnd));
          if (!isWithinInterval(tDate, { start: s, end: e })) return false;
        }
      }

      return true;
    });
  }, [transfers, searchQuery, dateFilter, customStart, customEnd, destinationFilter, sourceFilter]);

  // Aggregate Metrics for the 3 Summary Cards
  const totalWorth = useMemo(() => {
    return filteredTransfers.reduce(
      (sum, t) => sum + (Number(t.totalWorth) || 0),
      0
    );
  }, [filteredTransfers]);

  const totalTyresCount = useMemo(() => {
    return filteredTransfers.reduce((sum, t) => {
      const itemsCount = (t.items || []).reduce(
        (iSum, it) => iSum + (Number(it.quantity) || 0),
        0
      );
      return sum + itemsCount;
    }, 0);
  }, [filteredTransfers]);

  const totalChallansCount = filteredTransfers.length;

  const resetFilters = () => {
    setSearchQuery("");
    setDateFilter("THIS_MONTH");
    setCustomStart("");
    setCustomEnd("");
    setDestinationFilter("ALL");
    setSourceFilter("ALL");
  };

  return (
    <div className="space-y-6">
      {/* CHALLAN MODAL */}
      {selectedTransferForChallan && (
        <TransferChallanModal
          transfer={selectedTransferForChallan}
          onClose={() => setSelectedTransferForChallan(null)}
        />
      )}

      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-[#522874]" />
          {title}
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-1">{description}</p>
      </div>

      {/* --- 3 MANDATORY SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TOTAL TRANSFER WORTH */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-sm relative overflow-hidden group hover:border-[#522874] transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#522874]"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
              Total Transfer Worth (Inward to Branch)
            </span>
            <div className="p-2 bg-purple-50 text-[#522874] rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#522874] mt-2">
            ₹{formatNumber(totalWorth, 2)}
          </div>
          <p className="text-xs text-gray-400 font-semibold mt-1">
            Sum of tyre, tube & flap transfer valuations
          </p>
        </div>

        {/* Card 2: TOTAL TYRES TRANSFERRED */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-sm relative overflow-hidden group hover:border-blue-600 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
              Total Tyres Transferred
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {formatNumber(totalTyresCount, 0)}{" "}
            <span className="text-sm font-bold text-gray-500">Units</span>
          </div>
          <p className="text-xs text-gray-400 font-semibold mt-1">
            Physical tyre pieces moved between branches
          </p>
        </div>

        {/* Card 3: TRANSFER CHALLANS */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-600 transition-all">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
              Transfer Challans
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {totalChallansCount}{" "}
            <span className="text-sm font-bold text-gray-500">Batches</span>
          </div>
          <p className="text-xs text-gray-400 font-semibold mt-1">
            Recorded delivery slips with rate snapshots
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challan number, tyre model, SKU, shop, or remarks..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none bg-white font-medium text-sm transition-all shadow-sm"
            />
          </div>

          {/* Destination Branch Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none bg-white font-bold text-sm text-gray-700 shadow-sm cursor-pointer"
            >
              <option value="ALL">All Destination Branches</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  To: {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="w-full sm:w-auto">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none bg-white font-bold text-sm text-gray-700 shadow-sm cursor-pointer"
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7">Last 7 Days</option>
              <option value="ALL">All Time</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {/* Reset button */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center p-2.5 rounded-xl border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all shadow-sm active:scale-95 bg-white cursor-pointer"
            title="Reset All Filters"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Date Inputs if selected */}
        {dateFilter === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-gray-500 uppercase">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium outline-none shadow-sm"
            />
            <span className="text-xs font-bold text-gray-500 uppercase">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium outline-none shadow-sm"
            />
          </div>
        )}
      </div>

      {/* TRANSFER ENTRIES TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-600">
              <tr>
                <th className="py-4 px-5 font-black">Date & Challan No.</th>
                <th className="py-4 px-5 font-black">Transfer Route</th>
                <th className="py-4 px-5 font-black">Tyres Transferred (Breakdown & Rates)</th>
                <th className="py-4 px-5 font-black text-center">Total Qty</th>
                <th className="py-4 px-5 font-black text-right">Transfer Worth</th>
                <th className="py-4 px-5 font-black text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 px-6 text-center">
                    <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Truck className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-gray-800 text-lg">
                      No stock transfers found
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      No branch movements recorded matching your current filter settings.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => {
                  const itemsCount = (t.items || []).reduce(
                    (sum, it) => sum + (Number(it.quantity) || 0),
                    0
                  );

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-purple-50/20 transition-colors"
                    >
                      {/* Date & Challan No. */}
                      <td className="py-4 px-5 align-top">
                        <div className="font-black text-gray-900 flex items-center gap-1.5">
                          <span className="font-mono text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded border border-purple-200 text-xs">
                            {t.transferNumber}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mt-1.5 flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                          {format(new Date(t.createdAt), "dd MMM yyyy, hh:mm a")}
                        </div>
                        {t.user?.fullName && (
                          <div className="text-[11px] text-gray-400 mt-1">
                            By: {t.user.fullName}
                          </div>
                        )}
                      </td>

                      {/* Transfer Route */}
                      <td className="py-4 px-5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="font-bold text-gray-400 uppercase text-[10px]">
                              From:
                            </span>
                            <span className="font-bold text-gray-800">
                              {t.fromLocation?.name || "Shop A / Central"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold">
                            <span className="font-bold text-gray-400 uppercase text-[10px]">
                              To:
                            </span>
                            <span className="font-extrabold text-green-800 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              {t.toLocation?.name || "Shop B / Branch"}
                            </span>
                          </div>
                          {t.notes && (
                            <p className="text-[11px] text-gray-500 italic mt-1 line-clamp-1">
                              Note: {t.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Tyre Breakdown & Rates */}
                      <td className="py-4 px-5 align-top">
                        <div className="space-y-2 max-w-md">
                          {(t.items || []).map((it, idx) => {
                            const p = it.product || {};
                            const isTTF = p.hasTube || p.hasFlap;
                            return (
                              <div
                                key={it.id || idx}
                                className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between font-bold text-gray-900">
                                  <span>
                                    {p.modelName || "Apollo Tyre"} ({p.size || "Std"})
                                  </span>
                                  <span className="text-[#522874]">
                                    {it.quantity} × ₹{formatNumber(it.unitPrice, 2)}
                                  </span>
                                </div>
                                {isTTF && (
                                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-gray-600">
                                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold uppercase">
                                      TTF Set
                                    </span>
                                    {p.tubeName && <span>+{p.tubeName}</span>}
                                    {p.flapName && <span>+{p.flapName}</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Total Quantity */}
                      <td className="py-4 px-5 align-top text-center">
                        <span className="font-black text-gray-900 text-base">
                          {itemsCount}
                        </span>
                        <div className="text-[10px] uppercase font-bold text-gray-400">
                          Tyres
                        </div>
                      </td>

                      {/* Total Transfer Worth */}
                      <td className="py-4 px-5 align-top text-right">
                        <div className="font-black text-lg text-[#522874]">
                          ₹{formatNumber(t.totalWorth, 2)}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-gray-400">
                          Inward Value
                        </div>
                      </td>

                      {/* Action: Print Challan */}
                      <td className="py-4 px-5 align-top text-center">
                        <button
                          onClick={() => setSelectedTransferForChallan(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:text-[#522874] hover:border-[#522874] hover:bg-purple-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Challan</span>
                        </button>
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
  );
}


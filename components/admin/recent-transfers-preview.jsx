"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Truck, ArrowRight, Printer, CalendarDays, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/format";
import TransferChallanModal from "@/components/admin/transfer-challan-modal";

export default function RecentTransfersPreview({ transfers = [] }) {
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const recentTransfers = transfers.slice(0, 5);

  return (
    <>
      {selectedTransfer && (
        <TransferChallanModal
          transfer={selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-50 text-[#522874] rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                Recent Transfers (Last 5)
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Latest branch dispatches with valuation & printable delivery slips
              </p>
            </div>
          </div>

          <Link
            href="/purchases?tab=transfers"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#522874] hover:text-[#3d1d56] transition-colors"
          >
            <span>View Full Transfer Ledger</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Compact Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3 px-5 font-black">Date & Challan No.</th>
                <th className="py-3 px-5 font-black">Route</th>
                <th className="py-3 px-5 font-black">Tyres Dispatched</th>
                <th className="py-3 px-5 font-black text-right">Total Worth</th>
                <th className="py-3 px-5 font-black text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTransfers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-5 text-center text-gray-500">
                    <p className="font-bold text-gray-700">No transfers recorded yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Use the form above to dispatch your first batch transfer.
                    </p>
                  </td>
                </tr>
              ) : (
                recentTransfers.map((t) => {
                  const totalUnits = (t.items || []).reduce(
                    (sum, it) => sum + (Number(it.quantity) || 0),
                    0
                  );

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-purple-50/20 transition-colors"
                    >
                      {/* Date & Challan */}
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block text-xs">
                          {t.transferNumber}
                        </div>
                        <div className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-gray-400" />
                          {format(new Date(t.createdAt), "dd MMM, hh:mm a")}
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-5">
                        <div className="text-xs space-y-0.5">
                          <div className="text-gray-600 font-medium truncate max-w-[160px]">
                            <span className="font-bold text-gray-400 text-[10px]">From: </span>
                            {t.fromLocation?.name || "Shop A"}
                          </div>
                          <div className="text-green-800 font-bold truncate max-w-[160px]">
                            <span className="font-bold text-gray-400 text-[10px]">To: </span>
                            {t.toLocation?.name || "Shop B"}
                          </div>
                        </div>
                      </td>

                      {/* Tyres Dispatched */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-gray-900">
                          {totalUnits} Tyres ({t.items?.length || 0} models)
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-xs mt-0.5">
                          {(t.items || [])
                            .map((it) => `${it.product?.modelName || "Tyre"} (${it.quantity})`)
                            .join(", ")}
                        </div>
                      </td>

                      {/* Total Worth */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="font-black text-sm text-[#522874]">
                          ₹{formatNumber(t.totalWorth, 2)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTransfer(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:text-[#522874] hover:border-[#522874] hover:bg-purple-50 transition-all shadow-2xs cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
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

        {/* Footer */}
        {recentTransfers.length > 0 && (
          <div className="p-3 bg-gray-50/70 border-t border-gray-100 text-center">
            <Link
              href="/purchases?tab=transfers"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#522874] hover:underline"
            >
              <span>View all {transfers.length} transfers in Purchase & Transfer Ledger</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

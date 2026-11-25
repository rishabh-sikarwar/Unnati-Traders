"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  Printer,
  X,
  ArrowRight,
  Truck,
  Building2,
  Calendar,
  FileCheck,
  Package,
} from "lucide-react";

export default function TransferChallanModal({ transfer, onClose }) {
  const printRef = useRef(null);

  if (!transfer) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalQty = (transfer.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 print:my-0 print:shadow-none print:w-full print:max-w-none border border-gray-200">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-[#522874] rounded-lg">
              <Truck className="w-5 h-5" />
            </span>
            <span className="font-bold text-gray-900 text-sm sm:text-base">
              Stock Transfer Challan: {transfer.transferNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#522874] text-white rounded-xl text-sm font-bold hover:bg-[#3d1d56] transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Challan</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CHALLAN BODY */}
        <div ref={printRef} className="p-6 md:p-8 bg-white text-gray-900 print:p-8 space-y-6">
          {/* Challan Header */}
          <div className="border-b-2 border-gray-900 pb-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#522874] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Internal Branch Movement
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 uppercase tracking-tight">
                  Delivery / Transfer Challan
                </h2>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  UNNATI TRADERS • AUTHORISED DEALER APOLLO TYRES
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase font-bold text-gray-500">Challan No.</div>
                <div className="text-xl sm:text-2xl font-black text-[#522874] tracking-tight">
                  {transfer.transferNumber}
                </div>
                <div className="text-xs font-semibold text-gray-600 mt-1 flex items-center justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {format(new Date(transfer.createdAt), "dd MMM yyyy, hh:mm a")}
                </div>
              </div>
            </div>
          </div>

          {/* Branch Transfer Route Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {/* From Shop */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-gray-500">
                Dispatched From (Source Branch)
              </span>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
                <h3 className="text-base font-black text-gray-900">
                  {transfer.fromLocation?.name || "Shop A / Main Warehouse"}
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                Authorized Central Inventory & Apollo Stock Point
              </p>
            </div>

            {/* To Shop */}
            <div className="space-y-1 md:border-l md:border-gray-200 md:pl-4">
              <span className="text-[10px] uppercase font-black tracking-wider text-green-700">
                Delivered To (Destination Branch)
              </span>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-green-700 shrink-0" />
                <h3 className="text-base font-black text-green-950">
                  {transfer.toLocation?.name || "Shop B / Retail Branch"}
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                Destination Store Inward
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100/80 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="py-2.5 px-3 font-black text-center w-12">#</th>
                  <th className="py-2.5 px-3 font-black">Tyre Description / Set Details</th>
                  <th className="py-2.5 px-3 font-black text-center w-24">HSN</th>
                  <th className="py-2.5 px-3 font-black text-center w-24">Qty (Units)</th>
                  <th className="py-2.5 px-3 font-black text-right w-32">Rate (₹)</th>
                  <th className="py-2.5 px-3 font-black text-right w-36">Total Worth (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {(transfer.items || []).map((item, idx) => {
                  const product = item.product || {};
                  const isTTF = product.hasTube || product.hasFlap;
                  return (
                    <tr key={item.id || idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 text-center text-xs font-bold text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-black text-gray-900">
                          {product.modelName || "Apollo Commercial Tyre"}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                          Size: {product.size || "Standard"} • SKU: {product.sku || "N/A"}
                        </div>
                        {isTTF && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                              TTF Set
                            </span>
                            {product.tubeName && (
                              <span className="text-[11px] text-gray-600 font-semibold">
                                + {product.tubeName}
                              </span>
                            )}
                            {product.flapName && (
                              <span className="text-[11px] text-gray-600 font-semibold">
                                + {product.flapName}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-gray-600">
                        {product.hsnCode || "4011"}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-gray-900 text-base">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-700">
                        ₹{formatNumber(item.unitPrice, 2)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-gray-900">
                        ₹{formatNumber(item.totalValue, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 text-sm font-black">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right uppercase text-xs tracking-wider text-gray-500">
                    Total Movement Summary
                  </td>
                  <td className="py-3 px-3 text-center text-base font-black text-gray-900">
                    {totalQty} Tyres
                  </td>
                  <td className="py-3 px-3 text-right uppercase text-xs tracking-wider text-gray-500">
                    Total Rupee Worth:
                  </td>
                  <td className="py-3 px-3 text-right text-base font-black text-[#522874]">
                    ₹{formatNumber(transfer.totalWorth, 2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes & Transferred By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                Remarks / Vehicle Notes
              </span>
              <p className="font-medium text-gray-800">
                {transfer.notes || "Internal inter-branch transfer of commercial stock."}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                Authorized By / User
              </span>
              <p className="font-bold text-gray-800">
                {transfer.user?.fullName || transfer.user?.email || "Branch Manager"}
              </p>
              <p className="text-gray-500 text-[11px]">
                Internal valuation snapshot for Shop B inward inventory tracking.
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-14 border-b border-dashed border-gray-400"></div>
              <div className="font-bold text-gray-900 mt-2 uppercase tracking-wider">
                Dispatched By (Sender)
              </div>
              <div className="text-[11px] text-gray-500">Signature / Date</div>
            </div>
            <div>
              <div className="h-14 border-b border-dashed border-gray-400"></div>
              <div className="font-bold text-gray-900 mt-2 uppercase tracking-wider">
                Received in Good Condition (Receiver)
              </div>
              <div className="text-[11px] text-gray-500">Shop Inward Signature / Date</div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-gray-400 font-semibold pt-2">
            This is an internal stock transfer challan for branch inventory valuation. No supplier purchases were duplicated.
          </div>
        </div>
      </div>
    </div>
  );
}


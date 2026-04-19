"use client";

import { useState } from "react";
import {
  Search,
  CalendarDays,
  MapPin,
  User,
  FileText,
  ChevronRight,
  X,
  Package,
} from "lucide-react";

export default function PurchaseList({ purchases }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Filter purchases by invoice number or supplier name
  const filteredPurchases = purchases.filter(
    (p) =>
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice No. or Supplier Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all bg-gray-50"
          />
        </div>
      </div>

      {/* The Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6 font-bold">Date & Invoice</th>
                <th className="py-4 px-6 font-bold">Supplier & Location</th>
                <th className="py-4 px-6 font-bold text-center">Total Items</th>
                <th className="py-4 px-6 font-bold text-right">Total Amount</th>
                <th className="py-4 px-6 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-12 text-center text-gray-400 font-medium"
                  >
                    No purchase records found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const totalTyres = purchase.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );

                  return (
                    <tr
                      key={purchase.id}
                      className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                    >
                      {/* Date & Invoice */}
                      <td className="py-4 px-6">
                        <div className="font-black text-gray-900">
                          {purchase.invoiceNumber}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(purchase.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </td>

                      {/* Supplier & Location */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#522874]">
                          {purchase.supplierName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />{" "}
                          {purchase.location.name}
                        </div>
                      </td>

                      {/* Item Count */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-700">
                          <Package className="w-3 h-3 mr-1.5" /> {totalTyres}{" "}
                          Tyres
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-6 text-right font-black text-gray-900 text-lg">
                        ₹
                        {purchase.totalAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* View Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:text-[#522874] hover:border-[#522874] hover:bg-purple-50 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          <FileText className="w-4 h-4" /> View{" "}
                          <ChevronRight className="w-4 h-4" />
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

      {/* --- DETAILED VIEW MODAL --- */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-[#1a0a2e] text-white">
              <div>
                <h3 className="text-xl font-black mb-1">
                  Purchase Invoice Details
                </h3>
                <p className="text-purple-200 text-sm flex gap-4">
                  <span>{selectedPurchase.invoiceNumber}</span>
                  <span>|</span>
                  <span>
                    {new Date(selectedPurchase.createdAt).toLocaleDateString(
                      "en-IN",
                    )}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Supplier
                  </p>
                  <p className="font-bold text-gray-800">
                    {selectedPurchase.supplierName}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Delivered To
                  </p>
                  <p className="font-bold text-gray-800">
                    {selectedPurchase.location.name}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Logged By
                  </p>
                  <p className="font-bold text-gray-800 truncate">
                    {selectedPurchase.user?.fullName || "Admin"}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-purple-50/50 border-b border-purple-100 text-xs uppercase tracking-wider text-[#522874]">
                      <th className="py-3 px-4 font-bold">Tyre Details</th>
                      <th className="py-3 px-4 font-bold text-center">Qty</th>
                      <th className="py-3 px-4 font-bold text-right">
                        Unit Cost
                      </th>
                      <th className="py-3 px-4 font-bold text-right">
                        Total Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900">
                            {item.product.modelName}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Size: {item.product.size} | SKU: {item.product.sku}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-gray-800">
                          {item.quantity}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600">
                          ₹
                          {item.unitCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-4 px-4 text-right font-black text-gray-900">
                          ₹
                          {item.totalCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
              <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">
                Grand Total
              </span>
              <span className="text-2xl font-black text-green-600">
                ₹
                {selectedPurchase.totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

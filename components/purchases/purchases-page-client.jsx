"use client";

import { useState } from "react";
import Link from "next/link";
import { PackagePlus, Truck, ArrowLeftRight, ExternalLink } from "lucide-react";
import PurchaseForm from "@/components/purchases/purchase-form";
import BranchTransfersView from "@/components/admin/branch-transfers-view";

export default function PurchasesPageClient({
  products,
  locations,
  userId,
  userRole,
  userLocationId,
  transfers = [],
  initialTab = "supplier",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="space-y-6">
      {/* TABS NAVIGATION */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("supplier")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === "supplier"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <PackagePlus className="w-4 h-4 text-[#522874]" />
            <span>Supplier Purchases (Apollo Inward)</span>
          </button>

          <button
            onClick={() => setActiveTab("transfers")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === "transfers"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Truck className="w-4 h-4 text-[#522874]" />
            <span>Branch Transfers (Inward to Shop B)</span>
            {transfers.length > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-100 text-[#522874] text-xs font-black rounded-full">
                {transfers.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Button */}
        {activeTab === "transfers" ? (
          <Link
            href="/admin/transfer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#522874] text-white rounded-xl text-sm font-bold hover:bg-[#3d1d56] transition-all shadow-sm active:scale-95"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>+ Dispatch New Transfer</span>
          </Link>
        ) : (
          <Link
            href="/purchases/ledger"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-[#522874] transition-all shadow-sm active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Purchase Ledger</span>
          </Link>
        )}
      </div>

      {/* TAB CONTENT 1: SUPPLIER PURCHASE ENTRY */}
      {activeTab === "supplier" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
              <PackagePlus className="text-[#522874] h-7 w-7" />
              Supplier Purchase Invoice (Stock Inward)
            </h1>
            <p className="text-gray-500 mt-1 font-medium text-sm sm:text-base">
              Log Apollo distributor invoices strictly into Shop A / Warehouse
              so bills match Apollo’s statements.
            </p>
          </div>

          <PurchaseForm
            products={products}
            locations={locations}
            userId={userId}
            userRole={userRole}
            userLocationId={userLocationId}
          />
        </div>
      )}

      {/* TAB CONTENT 2: BRANCH TRANSFERS SUMMARY & INWARD */}
      {activeTab === "transfers" && (
        <div className="animate-in fade-in duration-300">
          <BranchTransfersView
            transfers={transfers}
            locations={locations}
            title="Branch Stock Transfers (Inward Valuation)"
            description="Exact ₹ value of tyres transferred from Shop A into Shop B without duplicating Apollo supplier bills."
            defaultDestinationId={
              userRole === "SHOPKEEPER" && userLocationId
                ? userLocationId
                : "ALL"
            }
            userRole={userRole}
          />
        </div>
      )}
    </div>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";
import { Truck, PackagePlus, ArrowLeftRight, ExternalLink } from "lucide-react";
import PurchaseList from "@/app/purchases/ledger/purchase-list";
import BranchTransfersView from "@/components/admin/branch-transfers-view";

export default function PurchaseLedgerClient({
  purchases,
  locations,
  userRole,
  showShopFilter,
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
            <Truck className="w-4 h-4 text-[#522874]" />
            <span>Apollo Supplier Inward</span>
            <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 text-xs font-black rounded-full">
              {purchases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("transfers")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === "transfers"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-[#522874]" />
            <span>Branch Transfers (Inward to Shop B)</span>
            <span className="px-1.5 py-0.2 bg-purple-100 text-[#522874] text-xs font-black rounded-full">
              {transfers.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/purchases"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#522874] text-white rounded-xl text-sm font-bold hover:bg-[#3d1d56] transition-all shadow-sm active:scale-95"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Log Inward</span>
          </Link>
          <Link
            href="/admin/transfer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-[#522874] transition-all shadow-sm active:scale-95"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer Stock</span>
          </Link>
        </div>
      </div>

      {/* TAB 1: SUPPLIER PURCHASES */}
      {activeTab === "supplier" && (
        <div className="animate-in fade-in duration-300 space-y-6">
          <PurchaseList
            purchases={purchases}
            locations={locations}
            userRole={userRole}
            showShopFilter={showShopFilter}
          />
        </div>
      )}

      {/* TAB 2: BRANCH STOCK TRANSFERS */}
      {activeTab === "transfers" && (
        <div className="animate-in fade-in duration-300">
          <BranchTransfersView
            transfers={transfers}
            locations={locations}
            title="Branch Stock Transfers (Shop B Inward)"
            description="Valued tyre transfers received into branch stores without creating duplicate Apollo supplier bills."
            userRole={userRole}
          />
        </div>
      )}
    </div>
  );
}


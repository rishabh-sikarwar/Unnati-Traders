"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingCart,
  Package,
  PackagePlus,
  AlertCircle,
  ScrollText,
  Undo2,
  Loader2,
  MapPin,
} from "lucide-react";

export default function ShopkeeperDashboard({ user }) {
  const [loadingHref, setLoadingHref] = useState(null);
  const shopName = user?.location?.name || "Your Shop";

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-20 md:pt-36 lg:pt-28">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Retail Operations
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#522874]" /> {shopName}
            </p>
          </div>
          <div className="bg-purple-50 text-[#522874] px-4 py-2 rounded-lg font-bold text-sm border border-purple-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
            Shop Active
          </div>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/billing" onClick={() => setLoadingHref("/billing")}>
            <Card className="cursor-pointer group hover:shadow-lg hover:border-green-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-green-50 rounded-full group-hover:scale-110 transition-transform">
                  {loadingHref === "/billing" ? (
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Generate Bill
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    New customer sale
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inventory" onClick={() => setLoadingHref("/inventory")}>
            <Card className="cursor-pointer group hover:shadow-lg hover:border-purple-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-purple-50 rounded-full group-hover:scale-110 transition-transform">
                  {loadingHref === "/inventory" ? (
                    <Loader2 className="w-8 h-8 text-[#522874] animate-spin" />
                  ) : (
                    <Package className="w-8 h-8 text-[#522874]" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Check Stock
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Search available tyres
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/purchases" onClick={() => setLoadingHref("/purchases")}>
            <Card className="cursor-pointer group hover:shadow-lg hover:border-blue-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-blue-50 rounded-full group-hover:scale-110 transition-transform">
                  {loadingHref === "/purchases" ? (
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  ) : (
                    <PackagePlus className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Receive Stock
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Inward Apollo delivery
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/returns" onClick={() => setLoadingHref("/returns")}>
            <Card className="cursor-pointer group hover:shadow-lg hover:border-red-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-red-50 rounded-full group-hover:scale-110 transition-transform">
                  {loadingHref === "/returns" ? (
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                  ) : (
                    <Undo2 className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    Process Return
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Handle warranty claims
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* SECONDARY INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link href="/orders" onClick={() => setLoadingHref("/orders")}>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg text-gray-600 group-hover:text-gray-900 transition-colors">
                  <ScrollText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    Today's Sales Register
                  </h4>
                  <p className="text-sm text-gray-500">
                    View all bills generated from this shop
                  </p>
                </div>
              </div>
              {loadingHref === "/orders" ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <span className="text-[#522874] font-bold text-sm">
                  View &rarr;
                </span>
              )}
            </div>
          </Link>

          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between opacity-80 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Low Stock Alerts</h4>
                <p className="text-sm text-orange-600">
                  Coming soon for Shopkeepers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

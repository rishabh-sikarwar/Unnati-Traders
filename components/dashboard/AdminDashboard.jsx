"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Package,
  RefreshCw,
  Store,
  Users,
  Loader2,
  PackagePlus,
  FileBarChart2,
  Undo2,
  Truck, // IMPORT THE NEW ICON
} from "lucide-react";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard"; 

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingHref, setLoadingHref] = useState(null);

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      setDashboardData(data);
      if (isManualRefresh) toast.success("Dashboard data updated!");
    } catch (err) {
      console.error(err);
      if (isManualRefresh) toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#522874]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-20 md:pt-36 lg:pt-28">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Master inventory and financial controls
            </p>
          </div>
          <Button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="bg-white text-[#522874] border border-[#522874]/20 hover:bg-purple-50 transition-all shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Sync Live Data"}
          </Button>
        </div>

        {/* PRIMARY ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/inventory" onClick={() => setLoadingHref("/inventory")}>
            <Card className="cursor-pointer group hover:shadow-lg hover:border-purple-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div>
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">
                    Check Stock
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-[#522874]">
                    Inventory Hub
                  </h3>
                </div>
                {loadingHref === "/inventory" ? (
                  <Loader2 className="text-[#522874] w-10 h-10 animate-spin shrink-0 ml-4" />
                ) : (
                  <Package className="text-[#522874] w-10 h-10 group-hover:scale-110 transition-transform shrink-0 ml-4" />
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/purchases" onClick={() => setLoadingHref("/purchases")}>
            <Card className="cursor-pointer group hover:shadow-lg hover:border-blue-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">
                    Incoming
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-blue-700">
                    Inward Stock
                  </h3>
                </div>
                {loadingHref === "/purchases" ? (
                  <Loader2 className="text-blue-600 w-10 h-10 animate-spin shrink-0 ml-4" />
                ) : (
                  <PackagePlus className="text-blue-600 w-10 h-10 group-hover:scale-110 transition-transform shrink-0 ml-4" />
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/billing" onClick={() => setLoadingHref("/billing")}>
            <Card className="cursor-pointer group hover:shadow-lg hover:border-green-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div>
                  <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">
                    Outgoing
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-green-700">
                    New Sale Bill
                  </h3>
                </div>
                {loadingHref === "/billing" ? (
                  <Loader2 className="text-green-600 w-10 h-10 animate-spin shrink-0 ml-4" />
                ) : (
                  <ShoppingCart className="text-green-600 w-10 h-10 group-hover:scale-110 transition-transform shrink-0 ml-4" />
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* SECONDARY SETTINGS (Now a 4-column grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Manage Shops",
              icon: Store,
              href: "/admin/shops",
              color: "text-blue-600",
            },
            {
              title: "Manage Users",
              icon: Users,
              href: "/admin/users",
              color: "text-teal-600",
            },
            {
              title: "Manage Stock",
              icon: RefreshCw,
              href: "/inventory/manage",
              color: "text-orange-600",
            },
            {
              title: "Tax & Reports",
              icon: FileBarChart2,
              href: "/reports",
              color: "text-rose-600",
            },
            {
              title: "Tyre Return",
              icon: Undo2,
              href: "/returns",
              color: "text-rose-600",
            },
            {
              title: "Purchase Statement",
              icon: Truck,
              href: "/purchases/ledger",
              color: "text-rose-600",
            },
          ].map((card, idx) => (
            <Link key={idx} href={card.href} onClick={() => setLoadingHref(card.href)}>
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-gray-100 ${card.color}`}>
                    {loadingHref === card.href ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <card.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-bold text-gray-700">{card.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* PLUG IN THE CLEAN SEPARATED ANALYTICS COMPONENT */}
        {dashboardData && <AnalyticsDashboard dashboardData={dashboardData} locations={dashboardData?.locations} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
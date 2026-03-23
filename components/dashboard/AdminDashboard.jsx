"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  RefreshCw,
  Store,
  Users,
  Loader2,
  Receipt,
} from "lucide-react";

const COLORS = ["#522874", "#10B981", "#F59E0B"];

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const summary = dashboardData?.summary || {};
  const salesData = dashboardData?.salesData || [];
  const categoryData = dashboardData?.categoryData || [];

  return (
    <div className="min-h-screen bg-gray-50 px-6 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
            <p className="text-gray-500">
              Master inventory and financial controls
            </p>
          </div>
          <Button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="bg-white text-[#522874] border border-[#522874]/20 hover:bg-purple-50 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* PRIMARY ACTION CARDS - High Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/inventory">
            <Card className="cursor-pointer group hover:shadow-lg hover:border-purple-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardContent className="p-8 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-purple-500 uppercase tracking-widest mb-1">
                    Daily Operations
                  </p>
                  <h3 className="text-2xl font-black text-gray-900 group-hover:text-[#522874]">
                    Inventory Hub
                  </h3>
                  <p className="text-gray-500 text-sm mt-2">
                    Update stock, view levels, and manage shop availability.
                  </p>
                </div>
                <Package className="text-[#522874] w-12 h-12 group-hover:scale-110 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/billing">
            <Card className="cursor-pointer group hover:shadow-lg hover:border-green-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardContent className="p-8 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-green-500 uppercase tracking-widest mb-1">
                    Quick Action
                  </p>
                  <h3 className="text-2xl font-black text-gray-900 group-hover:text-green-700">
                    New Bill / Sale
                  </h3>
                  <p className="text-gray-500 text-sm mt-2">
                    Generate retail or wholesale invoices instantly.
                  </p>
                </div>
                <ShoppingCart className="text-green-600 w-12 h-12 group-hover:scale-110 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* SECONDARY SETTINGS - Lower Usage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            {
              title: "Shops",
              icon: Store,
              href: "/admin/shops",
              color: "text-blue-600",
            },
            {
              title: "Users",
              icon: Users,
              href: "/admin/users",
              color: "text-teal-600",
            },
            {
              title: "Transfer Stock",
              icon: RefreshCw,
              href: "/admin/transfer",
              color: "text-orange-600",
            },
          ].map((card, idx) => (
            <Link key={idx} href={card.href}>
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <card.icon className={`${card.color} w-6 h-6`} />
                  <span className="font-bold text-gray-700">{card.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              label: "Total Revenue",
              value: `₹${summary.totalSales?.toLocaleString() || 0}`,
              icon: DollarSign,
              color: "text-green-600",
              bg: "bg-green-100",
            },
            {
              label: "Total Purchases",
              value: `₹${summary.totalPurchases?.toLocaleString() || 0}`,
              icon: TrendingUp,
              color: "text-purple-600",
              bg: "bg-purple-100",
            },
            {
              label: "Total Orders",
              value: summary.totalOrders || 0,
              icon: ShoppingCart,
              color: "text-blue-600",
              bg: "bg-blue-100",
            },
            {
              label: "Total Stock",
              value: summary.totalStock || 0,
              icon: Package,
              color: "text-orange-600",
              bg: "bg-orange-100",
            },
          ].map((metric, idx) => (
            <Card key={idx} className="border-none shadow-sm">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {metric.label}
                  </p>
                  <p className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.bg}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800">
                Revenue vs Purchases
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    dataKey="sales"
                    fill="#522874"
                    name="Sales"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="purchases"
                    fill="#10B981"
                    name="Purchases"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800">
                Sales Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={5}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

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
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 pt-24">
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

        {/* ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Shops",
              subtitle: "Manage",
              icon: Store,
              href: "/admin/shops",
              color: "text-purple-600",
            },
            {
              title: "Users",
              subtitle: "Manage",
              icon: Users,
              href: "/admin/users",
              color: "text-green-600",
            },
            {
              title: "Transfer Stock",
              subtitle: "Inventory",
              icon: Package,
              href: "/admin/transfer",
              color: "text-orange-600",
            },
          ].map((card, idx) => (
            <Link key={idx} href={card.href}>
              <Card className="cursor-pointer group hover:shadow-lg hover:border-purple-200 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 flex justify-between items-center bg-gradient-to-br from-white to-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                      {card.subtitle}
                    </p>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#522874] transition-colors">
                      {card.title}
                    </h3>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform ${card.color}`}
                  >
                    <card.icon className="w-7 h-7" />
                  </div>
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

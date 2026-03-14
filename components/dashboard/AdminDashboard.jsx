"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

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
} from "lucide-react";

const COLORS = ["#522874", "#10B981", "#F59E0B"];

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading Dashboard...
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const salesData = dashboardData?.salesData || [];
  const categoryData = dashboardData?.categoryData || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
            <p className="text-gray-600">
              Master inventory and financial controls
            </p>
          </div>

          <Button onClick={fetchDashboard} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/shops">
            <Card className="cursor-pointer hover:shadow-lg transition">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Manage</p>
                  <h3 className="text-lg font-semibold">Shops</h3>
                </div>

                <Store className="text-purple-600 w-8 h-8" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="cursor-pointer hover:shadow-lg transition">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Manage</p>
                  <h3 className="text-lg font-semibold">Users</h3>
                </div>

                <Users className="text-green-600 w-8 h-8" />
              </CardContent>
            </Card>
          </Link>

          <Card
            className="cursor-pointer hover:shadow-lg transition"
            onClick={fetchDashboard}
          >
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Update</p>
                <h3 className="text-lg font-semibold">Refresh Data</h3>
              </div>

              <RefreshCw className="text-blue-600 w-8 h-8" />
            </CardContent>
          </Card>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>

                <p className="text-2xl font-bold text-green-600">
                  ₹{summary.totalSales?.toLocaleString()}
                </p>
              </div>

              <DollarSign className="text-green-600 w-8 h-8" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Purchases</p>

                <p className="text-2xl font-bold text-purple-600">
                  ₹{summary.totalPurchases?.toLocaleString()}
                </p>
              </div>

              <TrendingUp className="text-purple-600 w-8 h-8" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>

                <p className="text-2xl font-bold text-blue-600">
                  {summary.totalOrders}
                </p>
              </div>

              <ShoppingCart className="text-blue-600 w-8 h-8" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Stock (All Shops)</p>

                <p className="text-2xl font-bold text-orange-600">
                  {summary.totalStock}
                </p>
              </div>

              <Package className="text-orange-600 w-8 h-8" />
            </CardContent>
          </Card>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SALES VS PURCHASE */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue vs Purchases</CardTitle>
            </CardHeader>

            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Bar dataKey="sales" fill="#522874" name="Sales" />

                  <Bar dataKey="purchases" fill="#10B981" name="Purchases" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CATEGORY CHART */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Category</CardTitle>
            </CardHeader>

            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
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

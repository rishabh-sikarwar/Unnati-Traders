"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Download,
  RefreshCw,
} from "lucide-react";

const AdminDashboard = () => {
  // We will replace this with real Prisma data soon!
  const [dashboardData] = useState({
    summary: {
      totalSales: 125000,
      totalPurchases: 89000,
      totalOrders: 342,
      totalStock: 1250,
      salesTarget: 150000,
      salesAchieved: 125000,
    },
    salesData: [
      { month: "Jan", sales: 12000, purchases: 8000 },
      { month: "Feb", sales: 15000, purchases: 9500 },
    ],
    categoryData: [
      { name: "Car Tyres", value: 45 },
      { name: "Bike Tyres", value: 25 },
      { name: "Truck/Commercial", value: 30 },
    ],
  });

  const COLORS = ["#522874", "#10B981", "#F59E0B"];
  const salesTargetPercentage = Math.round(
    (dashboardData.summary.salesAchieved / dashboardData.summary.salesTarget) *
      100,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
            <p className="text-gray-600">
              Master inventory and financial controls.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{dashboardData.summary.totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Stock (All Shops)
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dashboardData.summary.totalStock}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Add more metric cards as needed */}
        </div>

        {/* Charts & Target */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue vs Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.salesData}>
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

          <Card>
            <CardHeader>
              <CardTitle>Sales Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {dashboardData.categoryData.map((entry, index) => (
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

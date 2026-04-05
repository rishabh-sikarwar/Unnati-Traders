"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrendingUp, DollarSign, ShoppingCart, Package } from "lucide-react";

// Expanded color palette for dynamic categories
const COLORS = [
  "#522874",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
];

// Custom formatter to show currency in tooltips
const currencyFormatter = (value) =>
  `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AnalyticsDashboard({ dashboardData }) {
  const summary = dashboardData?.summary || {};
  const salesData = dashboardData?.salesData || [];
  const categoryData = dashboardData?.categoryData || [];

  return (
    <div className="space-y-6">
      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Total Revenue",
            value: `₹${(summary.totalSales || 0).toLocaleString()}`,
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-100",
          },
          {
            label: "Total Purchases",
            value: `₹${(summary.totalPurchases || 0).toLocaleString()}`,
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
          <Card
            key={idx}
            className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {metric.label}
                </p>
                <p className={`text-2xl font-black ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${metric.bg}`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BAR CHART: REVENUE VS PURCHASES */}
        <Card className="lg:col-span-2 shadow-sm border border-gray-100">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-lg font-bold text-gray-800">
              Revenue vs Purchase Costs (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={salesData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(value) =>
                    `₹${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`
                  } // Formats Y axis to 'k' for thousands
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  formatter={currencyFormatter}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    fontWeight: "bold",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px", fontWeight: 600 }}
                />
                <Bar
                  dataKey="sales"
                  fill="#522874"
                  name="Sales Revenue"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="purchases"
                  fill="#10B981"
                  name="Purchase Costs"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PIE CHART: SALES BY CATEGORY */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-lg font-bold text-gray-800">
              Revenue by Tyre Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {categoryData.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-gray-400 font-medium">
                No sales data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={5}
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={currencyFormatter}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontWeight: "bold",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#4B5563",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

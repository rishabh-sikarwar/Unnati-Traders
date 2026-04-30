"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Package, Filter, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/format";
import toast from "react-hot-toast";

const COLORS = ["#522874", "#10B981", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6"];
const currencyFormatter = (value) => `₹${formatNumber(value, 2)}`;

// We now accept locations to populate the filter dropdown
export default function AnalyticsDashboard({ initialData , locations = []}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  
  // Filter States
  const [dateRange, setDateRange] = useState("30"); // days
  const [locationId, setLocationId] = useState(initialData?.defaultLocationId || "ALL");

  const fetchFilteredData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?days=${dateRange}&locationId=${locationId}`);
      if (!res.ok) throw new Error("Failed to fetch filtered data");
      const newData = await res.json();
      setData(newData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    fetchFilteredData();
  }, [dateRange, locationId]);

  const summary = data?.summary || {};
  const salesData = data?.salesData || [];
  const categoryData = data?.categoryData || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-widest shrink-0">
          <Filter className="w-4 h-4 text-[#522874]" /> Filters:
        </div>
        
        <div className="flex flex-wrap gap-3 w-full">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer flex-1 sm:flex-none"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="365">This Year</option>
          </select>

          {locations.length > 0 && (
            <select 
              value={locationId} 
              onChange={(e) => setLocationId(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer flex-1 sm:flex-none"
            >
              <option value="ALL">All Shops & Warehouses</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}

          {loading && <Loader2 className="w-5 h-5 text-[#522874] animate-spin ml-2 self-center" />}
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: `₹${formatNumber(summary.totalSales || 0, 2)}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
          { label: "Total Purchases", value: `₹${formatNumber(summary.totalPurchases || 0, 2)}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Total Orders", value: summary.totalOrders || 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Total Stock", value: summary.totalStock || 0, icon: Package, color: "text-orange-600", bg: "bg-orange-100" },
        ].map((metric, idx) => (
          <Card key={idx} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{metric.label}</p>
                <p className={`text-2xl font-black ${metric.color}`}>{metric.value}</p>
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
            <CardTitle className="text-lg font-bold text-gray-800">Revenue vs Purchase Costs</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}`} />
                <Tooltip cursor={{ fill: "#f3f4f6" }} formatter={currencyFormatter} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }} />
                <Legend wrapperStyle={{ paddingTop: "20px", fontWeight: 600 }} />
                <Bar dataKey="sales" fill="#522874" name="Sales Revenue" radius={[6, 6, 0, 0]} maxBarSize={50} />
                <Bar dataKey="purchases" fill="#10B981" name="Purchase Costs" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PIE CHART: SALES BY CATEGORY */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-lg font-bold text-gray-800">Revenue by Tyre Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {categoryData.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-gray-400 font-medium">No sales data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="45%" innerRadius={70} outerRadius={100} dataKey="value" nameKey="name" paddingAngle={5} stroke="none">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={currencyFormatter} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: "bold" }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: 600, color: "#4B5563" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
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
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Filter,
  Loader2,
  Calendar,
  Store,
  ChevronDown,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import toast from "react-hot-toast";

const COLORS = [
  "#522874",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
];
const currencyFormatter = (value) => `₹${formatNumber(value, 2)}`;

// We now accept locations to populate the filter dropdown
export default function AnalyticsDashboard({ initialData, locations = [] }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [dateRange, setDateRange] = useState("month"); // month or days
  const [locationId, setLocationId] = useState(
    initialData?.defaultLocationId || "ALL",
  );

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const dateRanges = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "7", label: "Last 7 Days" },
    { value: "month", label: "This Month" },
    { value: "lastmonth", label: "Last Month" },
    { value: "90", label: "Last 3 Months" },
    { value: "365", label: "This Year" },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".date-dropdown-container")) {
        setDateDropdownOpen(false);
      }
      if (!e.target.closest(".location-dropdown-container")) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchFilteredData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/dashboard?range=${dateRange}&locationId=${locationId}`,
      );
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

  const safeCategoryData = categoryData.map(item => ({
    ...item,
    value: Number(item.value) || 0
  }));
  
  const safeSalesData = salesData.map(item => ({
    ...item,
    sales: Number(item.sales) || 0,
    purchases: Number(item.purchases) || 0
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* FILTER TOOLBAR */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-widest shrink-0">
          <Filter className="w-4 h-4 text-[#522874]" /> Filters:
        </div>

        <div className="flex flex-wrap gap-3 w-full items-center">
          {/* Date Filter Dropdown */}
          <div className="relative date-dropdown-container flex-1 sm:flex-none">
            <button
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setLocationDropdownOpen(false);
              }}
              className="w-full sm:w-auto flex items-center justify-between gap-2.5 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer transition-all"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#522874]" />
                {dateRanges.find((r) => r.value === dateRange)?.label || "Select Date"}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dateDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dateDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {dateRanges.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => {
                      setDateRange(r.value);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                      dateRange === r.value
                        ? "bg-purple-50 text-[#522874] font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {r.label}
                    {dateRange === r.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#522874]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Filter Dropdown */}
          {locations.length > 0 && (
            <div className="relative location-dropdown-container flex-1 sm:flex-none">
              <button
                onClick={() => {
                  setLocationDropdownOpen(!locationDropdownOpen);
                  setDateDropdownOpen(false);
                }}
                className="w-full sm:w-auto flex items-center justify-between gap-2.5 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#522874]" />
                  {locationId === "ALL" 
                    ? "All Shops & Warehouses" 
                    : locations.find((l) => l.id === locationId)?.name || "Select Location"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${locationDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {locationDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setLocationId("ALL");
                      setLocationDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                      locationId === "ALL"
                        ? "bg-purple-50 text-[#522874] font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Shops & Warehouses
                    {locationId === "ALL" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#522874]" />
                    )}
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setLocationId(loc.id);
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                        locationId === loc.id
                          ? "bg-purple-50 text-[#522874] font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {loc.name}
                      {locationId === loc.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#522874]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && (
            <Loader2 className="w-5 h-5 text-[#522874] animate-spin ml-2 shrink-0" />
          )}
        </div>
      </div>

      {/* METRICS */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 transition-opacity duration-300 ${loading ? "opacity-65 pointer-events-none" : "opacity-100"}`}>
        {[
          {
            label: "Total Revenue",
            value: `₹${formatNumber(summary.totalSales || 0, 2)}`,
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-gradient-to-br from-green-50 to-green-100 border border-green-200/50",
          },
          {
            label: "Total Purchases",
            value: `₹${formatNumber(summary.totalPurchases || 0, 2)}`,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50",
          },
          {
            label: "Total Orders",
            value: summary.totalOrders || 0,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50",
          },
          {
            label: "Total Stock",
            value: summary.totalStock || 0,
            icon: Package,
            color: "text-orange-600",
            bg: "bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50",
          },
        ].map((metric, idx) => (
          <Card
            key={idx}
            className="border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
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
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${loading ? "opacity-65 pointer-events-none" : "opacity-100"}`}>
        {/* BAR CHART: REVENUE VS PURCHASES */}
        <Card className="lg:col-span-2 shadow-sm border border-gray-100">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-lg font-bold text-gray-800">
              Revenue vs Purchase Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={safeSalesData}
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
                  }
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
            {safeCategoryData.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-gray-400 font-medium">
                No sales data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={safeCategoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={5}
                    stroke="none"
                  >
                    {safeCategoryData.map((entry, index) => (
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

import React from "react";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Receipt,
  ArrowDownToLine,
  AlertTriangle,
  IndianRupee,
  Store,
} from "lucide-react";

export default async function ShopkeeperDashboard() {
  // 1. Identify the user and their assigned shop
  const clerkUser = await currentUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
    include: { location: true },
  });

  const shop = dbUser?.location;

  // Failsafe: If admin hasn't assigned them a shop yet
  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">No Shop Assigned</h2>
        <p className="text-gray-500 mt-2">
          Please ask the Admin to assign your account to a retail location.
        </p>
      </div>
    );
  }

  // 2. Fetch Today's Sales for THIS specific shop
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysSales = await prisma.invoice.aggregate({
    where: {
      locationId: shop.id,
      status: "COMPLETED",
      createdAt: { gte: today },
    },
    _sum: { grandTotal: true },
    _count: true,
  });

  // 3. Fetch Inventory for THIS specific shop to find Low Stock
  const localInventory = await prisma.inventory.findMany({
    where: { locationId: shop.id },
    include: { product: true },
  });

  // Filter items where quantity has dropped below the product's lowStock threshold
  const lowStockAlerts = localInventory.filter(
    (item) => item.quantity <= item.product.lowStock,
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="text-[#522874] h-8 w-8" />
              {shop.name}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              Retail Operations Dashboard • {shop.address}
            </p>
          </div>

          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Today's Revenue
            </p>
            <p className="text-xl font-bold text-green-600">
              ₹{todaysSales._sum.grandTotal?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Action Cards (Buy, Sell, View) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SELL (Generate Invoice) */}
          <Link href="/billing">
            <Card className="cursor-pointer group hover:shadow-lg hover:border-purple-200 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-[#522874] to-[#3d1d56] text-white border-none">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 h-full">
                <div className="p-3 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Generate Bill (Sell)</h3>
                  <p className="text-sm text-white/70 mt-1">
                    Create new customer invoice
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* BUY (Receive Stock) */}
          <Link href="/inventory/receive">
            <Card className="cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 h-full">
                <div className="p-3 bg-blue-50 rounded-full group-hover:scale-110 transition-transform">
                  <ArrowDownToLine className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Receive Stock (Buy)
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Log inward tyre deliveries
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* VIEW STOCK */}
          <Link href="/stock/local">
            <Card className="cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 h-full">
                <div className="p-3 bg-orange-50 rounded-full group-hover:scale-110 transition-transform">
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Local Inventory
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Check current shop stock levels
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Two-Column Layout for Metrics & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="border-b border-gray-50 pb-4 flex flex-row items-center gap-2">
              <AlertTriangle className="text-orange-500 w-5 h-5" />
              <CardTitle className="text-lg font-bold text-gray-800">
                Action Required: Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {lowStockAlerts.length === 0 ? (
                  <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    All local stock levels are healthy!
                  </div>
                ) : (
                  lowStockAlerts.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-red-50 rounded-lg border border-red-100 gap-2 hover:shadow-md transition-shadow"
                    >
                      <div>
                        <span className="font-bold text-gray-900 block">
                          {item.product.modelName}
                        </span>
                        <span className="text-sm text-gray-600">
                          Size: {item.product.size} | SKU: {item.product.sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-md border border-red-200 w-fit">
                        <span className="text-sm font-medium text-gray-500">
                          Current Stock:
                        </span>
                        <span className="text-red-600 font-black text-lg">
                          {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-sm h-fit">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-bold text-gray-800">
                Today's Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <IndianRupee className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Gross Sales
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{todaysSales._sum.grandTotal?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Receipt className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Invoices Generated
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {todaysSales._count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

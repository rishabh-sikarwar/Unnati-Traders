"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Truck,
  ReceiptText,
  Clock,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const DealerDashboard = ({ user, stats: initialStats = null }) => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/dealer-orders/my-orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // Exclude CANCELLED orders from active bookings and billed stats
  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
  const billedOrders = orders.filter(
    (o) => (o.status === "BILLED" || o.status === "COMPLETED") && o.status !== "CANCELLED"
  );
  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-medium">
            <Clock className="w-3 h-3 mr-1 inline" /> Pending Bill
          </Badge>
        );
      case "BILLED":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-medium">
            <ReceiptText className="w-3 h-3 mr-1 inline" /> Bill Ready
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 font-medium">
            <AlertCircle className="w-3 h-3 mr-1 inline" /> Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-12 pt-28 md:pt-32">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Dealer Portal
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back, <span className="font-semibold text-gray-800">{user?.fullName || "Dealer"}</span>. Browse live stock and track your wholesale bookings.
            </p>
          </div>
          <Link href="/store">
            <Button className="bg-[#522874] hover:bg-[#432060] text-white flex items-center gap-2 px-5 py-2.5 shadow-sm">
              <ShoppingBag className="w-4 h-4" />
              Place Wholesale Order
            </Button>
          </Link>
        </div>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Catalogue & Quick Order */}
          <Card className="hover:shadow-md transition-shadow border-purple-100 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="p-2 bg-purple-50 text-[#522874] rounded-lg">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span>Quick Order</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Browse real-time shop warehouse inventory and request tyre stock in seconds.
              </p>
              <Link href="/store" className="block">
                <Button className="w-full bg-[#522874] hover:bg-[#432060] text-white">
                  View Catalogue & Order
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 2: Recent Orders Overview */}
          <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <span>Recent Bookings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-gray-500">Total Bookings</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats?.totalBookings ?? activeOrders.length}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {stats?.pendingOrders ?? pendingOrders.length} awaiting shopkeeper billing.
              </p>
              <Link href="#orders-list" className="block">
                <Button variant="outline" className="w-full border-gray-300">
                  Track All Orders
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 3: My Bills & Khata */}
          <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <span>My Bills & Khata</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-gray-500">Billed Invoices</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats?.billedInvoices ?? billedOrders.length}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Access official tax receipts and instant UPI payment QR codes.
              </p>
              {billedOrders.length > 0 ? (
                <Link href={`/store/orders/${billedOrders[0].id}`} className="block">
                  <Button variant="outline" className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                    View Latest Bill
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" disabled className="w-full text-gray-400">
                  No Invoices Yet
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section: Live Recent Orders List */}
        <div id="orders-list">
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#522874]" /> Recent Orders
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Click on an order to view live status, invoice details, or scan UPI QR code.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#522874]" />
                  <p className="text-sm">Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-800">No Orders Yet</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                    You haven&apos;t placed any wholesale requests yet. Explore live shop inventory and make your first booking!
                  </p>
                  <Link href="/store" className="inline-block mt-4">
                    <Button className="bg-[#522874] hover:bg-[#432060] text-white">
                      Browse Tyre Stock
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm md:text-base">
                            {order.orderNumber}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.totalTyres} {order.totalTyres === 1 ? "Tyre" : "Tyres"} • Fulfilling Shop:{" "}
                          <span className="font-medium text-gray-700">{order.location?.name || "Shop"}</span> •{" "}
                          {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a") : ""}
                        </p>
                        {order.invoice && (
                          <p className="text-xs font-semibold text-emerald-700">
                            Invoice: {order.invoice.invoiceNumber} • Grand Total: ₹{order.invoice.grandTotal.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/store/orders/${order.id}`}>
                          <Button
                            size="sm"
                            className={
                              order.status === "BILLED" || order.status === "COMPLETED"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-[#522874] hover:bg-[#432060] text-white"
                            }
                          >
                            {order.status === "BILLED" || order.status === "COMPLETED"
                              ? "View / Pay Bill"
                              : "View Order"}
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;


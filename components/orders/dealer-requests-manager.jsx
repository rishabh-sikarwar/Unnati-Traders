"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Store,
  Layers,
  ArrowRight,
  Printer,
  ChevronRight,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DealerRequestsManager({
  initialOrders = [],
  userRole = "SHOPKEEPER",
  shopName = "",
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [activeTab, setActiveTab] = useState("PENDING"); // PENDING or ALL
  const [loadingId, setLoadingId] = useState(null);
  const [checkingId, setCheckingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Sync state when server revalidates initialOrders
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Silent Auto-Refresh Polling every 30 seconds for incoming dealer requests
  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [router]);

  // Filtered orders: "PENDING" view includes unfulfilled PENDING bookings, BILLED orders, and PAYMENT_SUBMITTED awaiting verification
  const displayedOrders = orders.filter((o) => {
    if (activeTab === "PENDING") {
      return o.status === "PENDING" || o.status === "BILLED" || o.status === "PAYMENT_SUBMITTED";
    }
    return true;
  });

  const handleFulfillClick = async (order) => {
    setCheckingId(order.id);
    try {
      const res = await fetch(`/api/dealer-orders/${order.id}/check-stock`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check shop inventory");
      }

      if (data.hasShortage) {
        const firstShortage = data.shortages?.[0];
        const reqQty = firstShortage?.requestedQuantity ?? "N/A";
        const stockQty = firstShortage?.actualShopStock ?? 0;

        toast.error(
          `Insufficient stock! Dealer requested ${reqQty}, but only ${stockQty} available. Arrange stock or cancel the order.`,
          { duration: 6000 }
        );
        return;
      }

      // Stock is sufficient! Proceed to billing
      router.push(`/billing?dealerOrderId=${order.id}`);
    } catch (err) {
      toast.error(err.message || "Failed to check stock");
    } finally {
      setCheckingId(null);
    }
  };

  const handleRejectOrder = async (orderId, orderNumber) => {
    const confirmed = window.confirm(
      `Are you sure you want to reject booking request ${orderNumber}? This will mark it as cancelled.`
    );
    if (!confirmed) return;

    setRejectingId(orderId);
    try {
      const res = await fetch(`/api/dealer-orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject booking request");
      }

      toast.success("Order request rejected and marked as cancelled.");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
      router.refresh();
    } catch (err) {
      toast.error(err.message || "An error occurred");
    } finally {
      setRejectingId(null);
    }
  };

  const handleMarkCompleted = async (orderId) => {
    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/dealer-orders/${orderId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to mark order as completed");
      }
      toast.success("Payment confirmed & order marked completed!");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "COMPLETED" } : o))
      );
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to complete order");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "PENDING"
                ? "bg-[#522874] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Requests (
            {orders.filter((o) => o.status === "PENDING" || o.status === "BILLED" || o.status === "PAYMENT_SUBMITTED").length})
            {orders.filter((o) => o.status === "PAYMENT_SUBMITTED").length > 0 && (
              <span className="bg-amber-300 text-amber-950 px-1.5 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                {orders.filter((o) => o.status === "PAYMENT_SUBMITTED").length} to verify
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "ALL"
                ? "bg-[#522874] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            All Requests ({orders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">
            {activeTab === "PENDING" ? "No Pending Requests" : "No Requests Found"}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {activeTab === "PENDING"
              ? "All wholesale dealer bookings for your location are fulfilled and verified."
              : "No wholesale booking requests have been placed yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const totalTyres = order.items.reduce((sum, it) => sum + it.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow transition-all space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-lg">
                        {order.orderNumber}
                      </span>
                      {order.status === "PENDING" && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                          <Clock className="w-3 h-3 mr-1 inline" /> Pending Fulfillment
                        </Badge>
                      )}
                      {order.status === "BILLED" && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          <Clock className="w-3 h-3 mr-1 inline" /> Billed • Awaiting Payment
                        </Badge>
                      )}
                      {order.status === "PAYMENT_SUBMITTED" && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse">
                          <Clock className="w-3 h-3 mr-1 inline" /> Payment Claimed by Dealer
                        </Badge>
                      )}
                      {order.status === "COMPLETED" && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Completed
                        </Badge>
                      )}
                      {order.status === "CANCELLED" && (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <XCircle className="w-3 h-3 mr-1 inline" /> Cancelled / Rejected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Requested on {format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a")} • Shop:{" "}
                      <span className="font-semibold text-gray-700">{order.location?.name}</span>
                    </p>
                  </div>

                  {/* Customer Information */}
                  <div className="flex items-center gap-3 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 text-xs">
                    <div className="w-8 h-8 rounded-full bg-[#522874] text-white flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {order.customer?.name || order.user?.fullName || "Wholesale Dealer"}
                      </p>
                      <p className="text-gray-500 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-[#522874]" />
                        {order.customer?.phone || order.user?.mobile || "No phone"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items requested */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Requested Stock ({totalTyres} Tyres)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {order.items.map((item) => {
                      const hasShortage =
                        item.actualShopStock !== undefined &&
                        item.actualShopStock < item.quantity;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                            hasShortage
                              ? "bg-red-50/70 border-red-200"
                              : "bg-gray-50 border-gray-200/60"
                          }`}
                        >
                          <div>
                            <p className="font-bold text-gray-900">{item.product?.modelName}</p>
                            <p className="text-gray-500 font-mono">
                              {item.product?.size} • {item.product?.brand}
                            </p>
                            {item.actualShopStock !== undefined && (
                              <p
                                className={`text-[11px] font-semibold mt-0.5 ${
                                  hasShortage ? "text-red-700" : "text-emerald-700"
                                }`}
                              >
                                Shop Stock: {item.actualShopStock}
                              </p>
                            )}
                          </div>
                          <span
                            className={`font-extrabold text-sm px-2.5 py-1 rounded-md border shadow-2xs ${
                              hasShortage
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-white text-[#522874] border-purple-100"
                            }`}
                          >
                            {item.quantity} Qty
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Reference (if dealer submitted payment) */}
                {order.status === "PAYMENT_SUBMITTED" && (
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50/70 rounded-xl border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold uppercase tracking-wider text-[10px] text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
                        UTR / Reference
                      </span>
                      <span className="font-mono font-bold text-sm text-gray-900 bg-white px-2 py-0.5 rounded border border-amber-300 shadow-2xs">
                        {order.paymentReference || "None provided"}
                      </span>
                      <span className="text-gray-600">
                        — Dealer declared payment done. Verify bank credit before completing.
                      </span>
                    </div>
                    {order.paymentSubmittedAt && (
                      <span className="text-[11px] text-amber-700 shrink-0 font-medium">
                        Submitted at {format(new Date(order.paymentSubmittedAt), "dd MMM, hh:mm a")}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes if any */}
                {order.notes && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                    <strong>Dealer Note:</strong> &ldquo;{order.notes}&rdquo;
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {order.status === "PENDING" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRejectOrder(order.id, order.orderNumber)}
                        disabled={rejectingId === order.id || checkingId === order.id}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold px-4 shadow-xs"
                      >
                        {rejectingId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Reject Request</span>
                      </Button>

                      <Button
                        onClick={() => handleFulfillClick(order)}
                        disabled={checkingId === order.id || rejectingId === order.id}
                        className="bg-[#522874] hover:bg-[#432060] text-white flex items-center gap-2 font-bold px-5 shadow-sm cursor-pointer"
                      >
                        {checkingId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Fulfill & Generate Bill</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {(order.status === "BILLED" || order.status === "PAYMENT_SUBMITTED") && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/billing/receipt/${order.invoiceId || order.invoice?.id}`}
                        target="_blank"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View Receipt
                        </Button>
                      </Link>
                      <Link href={`/store/orders/${order.id}`} target="_blank">
                        <Button size="sm" variant="outline" className="border-gray-200 text-gray-700">
                          Order Details
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleMarkCompleted(order.id)}
                        disabled={loadingId === order.id}
                        className={`text-white flex items-center gap-2 font-bold px-4 shadow-sm transition-all ${
                          order.status === "PAYMENT_SUBMITTED"
                            ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/50 shadow-emerald-200"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {loadingId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Verify Payment & Mark Completed</span>
                      </Button>
                    </div>
                  )}

                  {order.status === "COMPLETED" && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/billing/receipt/${order.invoiceId || order.invoice?.id}`}
                        target="_blank"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View Receipt
                        </Button>
                      </Link>
                      <Link href={`/store/orders/${order.id}`}>
                        <Button size="sm" variant="outline" className="border-gray-200">
                          Order Details
                        </Button>
                      </Link>
                    </div>
                  )}

                  {order.status === "CANCELLED" && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 border-red-300 py-1 px-2.5">
                        <XCircle className="w-3.5 h-3.5 mr-1 inline" /> Rejected
                      </Badge>
                      <Link href={`/store/orders/${order.id}`}>
                        <Button size="sm" variant="outline" className="border-gray-200">
                          Order Details
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

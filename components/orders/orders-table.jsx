"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Search,
  Printer,
  FileText,
  Loader2,
  Filter,
  Trash2,
  AlertTriangle,
  ReceiptText,
  Wallet,
  Smartphone,
  CreditCard,
  CircleDollarSign,
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { formatNumber } from "@/lib/format";

export function computeOrdersAnalytics(orders = []) {
  let totalInvoices = orders.length;
  let grossSales = 0;
  let cashCollection = 0;
  let upiCollection = 0;
  let cardCollection = 0;
  let creditSales = 0;
  let totalItemsSold = 0;

  orders.forEach((order) => {
    const grandTotal = Number(order.grandTotal) || 0;
    grossSales += grandTotal;
    totalItemsSold += (order.totalItemsCount || 0);

    let orderCash = 0;
    let orderUpi = 0;
    let orderCard = 0;

    // 1. Priority: Check PaymentLog table entries linked to this invoice
    if (Array.isArray(order.payments) && order.payments.length > 0) {
      order.payments.forEach((p) => {
        const amt = Number(p.amount) || 0;
        const mode = String(p.paymentMode || "").toUpperCase();
        if (mode === "CASH") orderCash += amt;
        else if (mode === "UPI" || mode === "ONLINE") orderUpi += amt;
        else if (mode === "CARD") orderCard += amt;
      });
    } else {
      // 2. Fallback: Parse Invoice split/mode fields
      const pMode = String(order.paymentMode || "").toUpperCase();
      if (pMode === "MULTIPLE" || pMode === "SPLIT") {
        orderCash = Number(order.splitCash) || 0;
        orderUpi = Number(order.splitUpi) || 0;
        orderCard = Number(order.splitCard) || 0;
      } else if (pMode === "CASH") {
        orderCash = Number(order.amountPaid) || grandTotal;
      } else if (pMode === "UPI" || pMode === "ONLINE") {
        orderUpi = Number(order.amountPaid) || grandTotal;
      } else if (pMode === "CARD") {
        orderCard = Number(order.amountPaid) || grandTotal;
      }
    }

    // Accumulate payment mode collections
    cashCollection += orderCash;
    upiCollection += orderUpi;
    cardCollection += orderCard;

    // Credit calculation: total invoice value minus upfront payments collected
    const totalPaidOnInvoice = orderCash + orderUpi + orderCard;
    const unpaidBalance = Math.max(0, grandTotal - totalPaidOnInvoice);
    creditSales += unpaidBalance;
  });

  const avgInvoiceValue = totalInvoices > 0 ? grossSales / totalInvoices : 0;

  return {
    totalInvoices,
    grossSales,
    cashCollection,
    upiCollection,
    cardCollection,
    creditSales,
    avgInvoiceValue,
    totalItemsSold,
  };
}

const getPaymentBadgeStyles = (mode) => {
  const normalized = String(mode).toUpperCase();
  switch (normalized) {
    case "CREDIT":
      return "bg-rose-100 text-rose-800 border-rose-300 font-black";
    case "CASH":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
    case "UPI":
    case "ONLINE":
    case "CARD":
      return "bg-blue-50 text-blue-700 border-blue-200 font-bold";
    case "SPLIT":
    case "MULTIPLE":
      return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 font-bold";
  }
};

const getOrderPaymentModes = (order) => {
  if (order.paymentMode !== "MULTIPLE") {
    return [order.paymentMode];
  }

  const modes = [];
  if (order.splitCash > 0) {
    modes.push("CASH");
  }
  if (order.splitUpi > 0) {
    modes.push("UPI");
  }
  if (order.splitCard > 0) {
    modes.push("CARD");
  }
  if (order.grandTotal - order.amountPaid > 0.01) {
    modes.push("CREDIT");
  }

  if (modes.length === 0) {
    modes.push("MULTIPLE");
  }
  return modes;
};

export default function OrdersTable({
  initialOrders,
  userRole,
  locations = [],
  currentFilters,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingOrderId, setLoadingOrderId] = useState(null);

  // Canceling states
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: "",
  });
  const [isCanceling, setIsCanceling] = useState(false);

  // Maintain filter state from URL props
  const [dateFilter, setDateFilter] = useState(
    currentFilters?.dateFilter || "today",
  );
  const [shopFilter, setShopFilter] = useState(
    currentFilters?.shopFilter || "ALL",
  );
  const [typeFilter, setTypeFilter] = useState(
    currentFilters?.typeFilter || "ALL",
  );
  const [customStart, setCustomStart] = useState(
    currentFilters?.customStart || "",
  );
  const [customEnd, setCustomEnd] = useState(currentFilters?.customEnd || "");

  // Update URL to trigger Server fetch
  const applyFilters = (newDate, newShop, newType, newStart, newEnd) => {
    startTransition(() => {
      let url = `/orders?date=${newDate}&shopId=${newShop}&type=${newType}`;
      if (newDate === "custom" && newStart && newEnd) {
        url += `&start=${newStart}&end=${newEnd}`;
      }
      router.push(url);
    });
  };

  // Local Search Filtering
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.invoiceNumber.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.phone?.toLowerCase().includes(query)
      );
    });
  }, [initialOrders, searchQuery]);

  const stats = useMemo(() => {
    return computeOrdersAnalytics(filteredOrders);
  }, [filteredOrders]);

  async function executeCancel() {
    setIsCanceling(true);
    const loadingToast = toast.loading(
      "Canceling Invoice & Restoring Stock...",
    );

    try {
      const res = await fetch(`/api/billing/${cancelModal.invoiceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");

      toast.success("Invoice Cancelled Successfully", { id: loadingToast });
      setCancelModal({ isOpen: false, invoiceId: null, invoiceNumber: "" });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsCanceling(false);
    }
  }

  // Generate dynamic empty state message
  const getEmptyMessage = () => {
    if (dateFilter === "today") return "No sales recorded yet today.";
    if (dateFilter === "yesterday") return "No sales were recorded yesterday.";
    if (dateFilter === "this_month") return "No sales recorded this month.";
    return "No invoices found for the selected timeline.";
  };

  return (
    <div className="space-y-6">
      {/* --- THE RESTORED CANCEL MODAL --- */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-5 mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Cancel Invoice?
            </h3>
            <p className="text-center text-gray-500 text-sm mb-8 leading-relaxed">
              Are you sure you want to permanently cancel invoice{" "}
              <span className="font-bold text-gray-900">
                "{cancelModal.invoiceNumber}"
              </span>
              ? All stock entries and connected payment logs will be restored
              immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setCancelModal({
                    isOpen: false,
                    invoiceId: null,
                    invoiceNumber: "",
                  })
                }
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={executeCancel}
                disabled={isCanceling}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isCanceling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR: SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center">
        {/* Local Text Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search within these results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#522874] transition-all font-medium text-gray-700"
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <Loader2 className="w-5 h-5 text-[#522874] animate-spin" />
            </div>
          )}
        </div>

        {/* Global Server Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto bg-gray-50 p-2 xl:p-0 xl:bg-transparent rounded-lg border border-gray-200 xl:border-none">
          <div className="hidden sm:flex items-center gap-1.5 text-[#522874] font-bold text-xs uppercase tracking-widest pl-2">
            <Filter className="w-4 h-4" /> Filters:
          </div>

          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              applyFilters(
                e.target.value,
                shopFilter,
                typeFilter,
                customStart,
                customEnd,
              );
            }}
            className="flex-1 sm:flex-none px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="all">All Time (Max 500)</option>
            <option value="custom">Custom Range...</option>
          </select>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <input
                type="date"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  if (customEnd)
                    applyFilters(
                      "custom",
                      shopFilter,
                      typeFilter,
                      e.target.value,
                      customEnd,
                    );
                }}
                className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  if (customStart)
                    applyFilters(
                      "custom",
                      shopFilter,
                      typeFilter,
                      customStart,
                      e.target.value,
                    );
                }}
                className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none"
              />
            </div>
          )}

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              applyFilters(
                dateFilter,
                shopFilter,
                e.target.value,
                customStart,
                customEnd,
              );
            }}
            className="flex-1 sm:flex-none px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
          >
            <option value="ALL">All Sales</option>
            <option value="B2B">B2B (Dealers)</option>
            <option value="B2C">B2C (Retail)</option>
          </select>

          {userRole === "ADMIN" && locations.length > 0 && (
            <select
              value={shopFilter}
              onChange={(e) => {
                setShopFilter(e.target.value);
                applyFilters(
                  dateFilter,
                  e.target.value,
                  typeFilter,
                  customStart,
                  customEnd,
                );
              }}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
            >
              <option value="ALL">All Shops</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ANALYTICS SUMMARY KPI GRID */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#522874] animate-pulse" />
            <h2 className="text-xs font-bold text-[#522874] uppercase tracking-wider">
              Selected Timeline Analytics
            </h2>
          </div>
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-3">
            {stats.totalItemsSold > 0 && (
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
                {formatNumber(stats.totalItemsSold, 0)} Items Sold
              </span>
            )}
            <span>
              Avg Invoice: <strong className="text-gray-900">₹{formatNumber(stats.avgInvoiceValue, 0)}</strong>
            </span>
          </div>
        </div>

        {/* 6 KPI Cards Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. TOTAL INVOICES */}
          <div className="bg-indigo-50/50 border border-indigo-100 hover:border-indigo-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                Total Invoices
              </span>
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-950">
              {stats.totalInvoices}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-1">
              Avg ₹{formatNumber(stats.avgInvoiceValue, 0)}/inv
            </div>
          </div>

          {/* 2. GROSS SALES */}
          <div className="bg-purple-50/60 border border-purple-200 hover:border-purple-300 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#522874] uppercase tracking-wider">
                Gross Sales
              </span>
              <div className="p-1.5 bg-purple-100 text-[#522874] rounded-lg">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#522874]">
              ₹{formatNumber(stats.grossSales, 2)}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-1">
              Total Revenue
            </div>
          </div>

          {/* 3. CASH COLLECTION */}
          <div className="bg-emerald-50/50 border border-emerald-100 hover:border-emerald-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Cash Collection
              </span>
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950">
              ₹{formatNumber(stats.cashCollection, 2)}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              {stats.grossSales > 0 ? ((stats.cashCollection / stats.grossSales) * 100).toFixed(1) : "0.0"}% of sales
            </div>
          </div>

          {/* 4. UPI COLLECTION */}
          <div className="bg-blue-50/50 border border-blue-100 hover:border-blue-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                UPI Collection
              </span>
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-950">
              ₹{formatNumber(stats.upiCollection, 2)}
            </div>
            <div className="text-[11px] text-blue-700 font-medium mt-1">
              {stats.grossSales > 0 ? ((stats.upiCollection / stats.grossSales) * 100).toFixed(1) : "0.0"}% of sales
            </div>
          </div>

          {/* 5. CARD COLLECTION */}
          <div className="bg-amber-50/50 border border-amber-100 hover:border-amber-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Card Collection
              </span>
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950">
              ₹{formatNumber(stats.cardCollection, 2)}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              {stats.grossSales > 0 ? ((stats.cardCollection / stats.grossSales) * 100).toFixed(1) : "0.0"}% of sales
            </div>
          </div>

          {/* 6. CREDIT SALES */}
          <div className="bg-rose-50/50 border border-rose-100 hover:border-rose-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                Credit Sales
              </span>
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <CircleDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-950">
              ₹{formatNumber(stats.creditSales, 2)}
            </div>
            <div className="text-[11px] text-rose-700 font-medium mt-1">
              {stats.grossSales > 0 ? ((stats.creditSales / stats.grossSales) * 100).toFixed(1) : "0.0"}% of sales
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[0.5px] z-10 flex items-center justify-center transition-all duration-300 animate-in fade-in">
            <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 font-bold text-sm text-[#522874]">
              <Loader2 className="w-4 h-4 animate-spin text-[#522874]" /> Loading sales register...
            </div>
          </div>
        )}
        <div className={`transition-all duration-200 ${isPending ? "opacity-60 pointer-events-none blur-[0.5px]" : ""}`}>
          <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Invoice Details
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              {userRole === "ADMIN" && (
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
              )}
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Grand Total
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            {filteredOrders.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan={userRole === "ADMIN" ? 6 : 5}
                  className="block md:table-cell p-16 text-center text-gray-500"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-black text-gray-900 text-xl">
                    {getEmptyMessage()}
                  </p>
                  <p className="text-sm mt-1 text-gray-500">
                    Try adjusting your date range or shop filter.
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="block md:table-row border-b border-gray-100 hover:bg-purple-50/20 transition-colors p-4 md:p-0"
                >
                  {/* DATE */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Date:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-gray-800">
                          {format(new Date(order.createdAt), "dd MMM yyyy")}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                          {format(new Date(order.createdAt), "hh:mm a")}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* INVOICE INFO */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Invoice:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-black text-[#522874]">
                          {order.invoiceNumber}
                        </div>
                        <div className="text-xs text-gray-500 font-bold mt-0.5 bg-gray-100 w-fit px-2 py-0.5 rounded">
                          {order._count?.items || 0} Items
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Customer:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-gray-900">
                          {order.customer?.name || "Walk-in Customer"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {order.customer?.phone || "No Phone"}
                        </div>
                        {(order.customer?.type === "SUB_DEALER" ||
                          order.customer?.type === "DISTRIBUTOR") && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black rounded uppercase tracking-wider">
                            B2B DEALER
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SHOP (Admins Only) */}
                  {userRole === "ADMIN" && (
                    <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                      <div className="flex justify-between md:block items-center">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                          Shop:
                        </span>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded uppercase tracking-wide">
                          {order.location?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* TOTAL */}
                  <td className="block md:table-cell p-3 md:p-4 md:text-right mb-4 md:mb-0 bg-gray-50 md:bg-transparent rounded-lg md:rounded-none">
                    <div className="flex justify-between md:justify-end items-center">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                        Grand Total:
                      </span>
                      <div className="flex flex-col items-end">
                        <div className="text-lg md:text-xl font-black text-green-600">
                          {`₹${formatNumber(order.grandTotal, 2)}`}
                        </div>
                        {order.paymentMode && (
                          <div className="flex flex-wrap gap-1 justify-end mt-1.5">
                            {getOrderPaymentModes(order).map((mode) => (
                              <span
                                key={mode}
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${getPaymentBadgeStyles(
                                  mode
                                )}`}
                              >
                                {mode.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="block md:table-cell md:p-4 md:text-right border-t md:border-none pt-4 md:pt-0">
                    <div className="flex items-center justify-end gap-2">
                      {userRole === "ADMIN" && (
                        <button
                          onClick={() =>
                            setCancelModal({
                              isOpen: true,
                              invoiceId: order.id,
                              invoiceNumber: order.invoiceNumber,
                            })
                          }
                          className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 p-2 md:py-2 md:px-3 rounded-lg text-sm font-bold transition-colors shadow-sm active:scale-95 border border-red-100 shrink-0"
                          title="Cancel Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/billing/receipt/${order.id}`}
                        onClick={() => setLoadingOrderId(order.id)}
                        className="flex-1 md:flex-none flex items-center justify-center md:justify-end gap-1.5 bg-[#522874] hover:bg-[#3d1d56] text-white px-3 py-2.5 md:py-2 rounded-lg text-sm font-bold transition-colors shadow-sm active:scale-95"
                      >
                        {loadingOrderId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Printer className="w-4 h-4" />
                        )}
                        {loadingOrderId === order.id
                          ? "Loading..."
                          : "View Receipt"}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}

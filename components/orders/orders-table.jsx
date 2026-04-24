"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Search, Printer, FileText, Loader2, Filter, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function OrdersTable({ initialOrders, userRole, locations = [], currentFilters }) {
  const router = useRouter();
  
  // Local Search state (still useful for instantly finding an invoice within the returned batch)
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  
  const [cancelModal, setCancelModal] = useState({ isOpen: false, invoiceId: null, invoiceNumber: "" });
  const [isCanceling, setIsCanceling] = useState(false);

  // Maintain filter state from URL props
  const [dateFilter, setDateFilter] = useState(currentFilters.dateFilter);
  const [shopFilter, setShopFilter] = useState(currentFilters.shopFilter);
  const [typeFilter, setTypeFilter] = useState(currentFilters.typeFilter);
  const [customStart, setCustomStart] = useState(currentFilters.customStart || "");
  const [customEnd, setCustomEnd] = useState(currentFilters.customEnd || "");

  // Update URL to trigger Server fetch
  const applyFilters = (newDate, newShop, newType, newStart, newEnd) => {
    let url = `/orders?date=${newDate}&shopId=${newShop}&type=${newType}`;
    if (newDate === "custom" && newStart && newEnd) {
      url += `&start=${newStart}&end=${newEnd}`;
    }
    router.push(url);
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

  async function executeCancel() {
    setIsCanceling(true);
    const loadingToast = toast.loading("Canceling Invoice...");
    try {
      const res = await fetch(`/api/billing/${cancelModal.invoiceId}`, { method: "DELETE" });
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
      {/* ... (Keep Cancel Modal HTML unchanged) ... */}

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
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#522874] transition-all font-medium text-gray-700"
          />
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
              applyFilters(e.target.value, shopFilter, typeFilter, customStart, customEnd);
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
                  if (customEnd) applyFilters("custom", shopFilter, typeFilter, e.target.value, customEnd);
                }}
                className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none" 
              />
              <span className="text-gray-400">to</span>
              <input 
                type="date" 
                value={customEnd} 
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  if (customStart) applyFilters("custom", shopFilter, typeFilter, customStart, e.target.value);
                }}
                className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none" 
              />
            </div>
          )}

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              applyFilters(dateFilter, shopFilter, e.target.value, customStart, customEnd);
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
                applyFilters(dateFilter, e.target.value, typeFilter, customStart, customEnd);
              }}
              className="flex-1 sm:flex-none px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
            >
              <option value="ALL">All Shops</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* METRICS BANNER */}
      <div className="flex justify-between items-center bg-purple-50 p-4 rounded-xl border border-purple-100">
        <span className="text-sm font-bold text-[#522874] uppercase tracking-widest">Selected Timeline Stats</span>
        <div className="text-right">
           <span className="text-xs text-gray-500 font-bold uppercase mr-3">Invoices: {filteredOrders.length}</span>
           <span className="text-xl font-black text-[#522874]">
             ₹{filteredOrders.reduce((sum, order) => sum + order.grandTotal, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
           </span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Details</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
              {userRole === "ADMIN" && <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Shop</th>}
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Grand Total</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            {filteredOrders.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan={userRole === "ADMIN" ? 6 : 5} className="block md:table-cell p-16 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-black text-gray-900 text-xl">{getEmptyMessage()}</p>
                  <p className="text-sm mt-1 text-gray-500">Try adjusting your date range or shop filter.</p>
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
                  <td className="block md:table-cell md:p-4 md:text-right mb-4 md:mb-0 bg-gray-50 md:bg-transparent rounded-lg p-3 md:p-0">
                    <div className="flex justify-between md:justify-end items-center">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                        Grand Total:
                      </span>
                      <div className="text-lg md:text-xl font-black text-green-600">
                        ₹
                        {order.grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="block md:table-cell md:p-4 md:text-right border-t md:border-none pt-4 md:pt-0">
                    <div className="flex items-center justify-end gap-2">
                      {userRole === "ADMIN" && (
                        <button
                          onClick={() => setCancelModal({ isOpen: true, invoiceId: order.id, invoiceNumber: order.invoiceNumber })}
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
  );
}

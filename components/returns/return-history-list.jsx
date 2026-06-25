"use client";

import { useState, useMemo } from "react";
import { formatNumber } from "@/lib/format";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  CalendarDays,
  MapPin,
  User,
  FileText,
  ChevronRight,
  X,
  Package,
  Filter,
  Trash2,
  AlertTriangle,
  Loader2,
  Undo2,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import Link from "next/link";

export default function ReturnHistoryList({
  returns,
  locations = [],
  userRole,
  showShopFilter = true,
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Filter States
  const [dateFilter, setDateFilter] = useState("ALL");
  const [shopFilter, setShopFilter] = useState("ALL");
  const [conditionFilter, setConditionFilter] = useState("ALL");

  // Deletion / Reversal States
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    returnId: null,
    customerName: "",
    refundAmount: 0,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute Filtered Returns
  const filteredReturns = useMemo(() => {
    const now = new Date();
    return returns.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const customerMatch = item.customer?.name?.toLowerCase().includes(query);
        const modelMatch = item.product?.modelName?.toLowerCase().includes(query);
        const skuMatch = item.product?.sku?.toLowerCase().includes(query);
        const reasonMatch = item.reason?.toLowerCase().includes(query);
        const remarkMatch = item.condition?.toLowerCase().includes(query);
        
        if (!customerMatch && !modelMatch && !skuMatch && !reasonMatch && !remarkMatch) {
          return false;
        }
      }

      // 2. Date Range Filter
      if (dateFilter !== "ALL") {
        const cutoffDate = subDays(now, parseInt(dateFilter));
        if (!isAfter(new Date(item.createdAt), cutoffDate)) {
          return false;
        }
      }

      // 3. Shop/Location Filter
      if (shopFilter !== "ALL") {
        if (item.locationId !== shopFilter) return false;
      }

      // 4. Tyre Condition Filter
      if (conditionFilter !== "ALL") {
        if (item.condition !== conditionFilter) return false;
      }

      return true;
    });
  }, [returns, searchQuery, dateFilter, shopFilter, conditionFilter]);

  // Execute Reversal/Delete call
  async function executeReversal() {
    setIsDeleting(true);
    const loadingToast = toast.loading("Reversing return and updating customer balance...");

    try {
      const res = await fetch(`/api/returns/${deleteModal.returnId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reverse return");

      toast.success("Return log reversed successfully. Dues updated!", { id: loadingToast });
      setDeleteModal({ isOpen: false, returnId: null, customerName: "", refundAmount: 0 });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* REVERSAL / DELETE MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 sm:p-8 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-5 mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Reverse Tyre Return?
            </h3>
            <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to permanently delete and reverse the tyre return log for{" "}
              <strong className="text-gray-800">{deleteModal.customerName}</strong>?<br />
              <br />
              <span className="text-red-600 font-bold block bg-red-50 p-3 rounded-lg border border-red-100 text-xs">
                ⚠️ WARNING: This will delete the Credit Note from the Customer's Khata, increasing their outstanding dues by ₹{formatNumber(deleteModal.refundAmount, 2)}. If the tyre was restocked, the shop's inventory will also be decremented.
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, returnId: null, customerName: "", refundAmount: 0 })
                }
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeReversal}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex justify-center items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Reverse Dues
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION BAR / NAVIGATION */}
      <div className="flex justify-between items-center">
        <Link
          href="/returns"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Process New Return
        </Link>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        
        {/* Text Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, tyre model, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all bg-gray-50 font-medium text-gray-800"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-gray-400 font-bold text-xs uppercase tracking-widest pl-2">
            <Filter className="w-4 h-4" /> Filters:
          </div>

          {/* Date range filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
          >
            <option value="ALL">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
          </select>

          {/* Shop filter (admin only) */}
          {showShopFilter && locations.length > 0 && (
            <select
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
            >
              <option value="ALL">All Shops</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          )}

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
          >
            <option value="ALL">All Conditions</option>
            <option value="GOOD">Good (Restocked)</option>
            <option value="DEFECTIVE">Defective (Claimed)</option>
          </select>
        </div>
      </div>

      {/* TABLE / LIST CONTAINER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-4 px-6 font-bold">Return Date</th>
                <th className="py-4 px-6 font-bold">Customer Name</th>
                <th className="py-4 px-6 font-bold">Tyre Details</th>
                <th className="py-4 px-6 font-bold text-center">Condition</th>
                <th className="py-4 px-6 font-bold text-center">Qty</th>
                <th className="py-4 px-6 font-bold text-right">Credit Issued</th>
                <th className="py-4 px-6 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400 font-medium">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-700 text-lg">No return logs match your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-purple-50/20 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {format(new Date(item.createdAt), "dd MMM yyyy")}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {format(new Date(item.createdAt), "hh:mm a")}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 text-sm">{item.customer?.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.customer?.phone || "No Phone"}</div>
                    </td>

                    {/* Tyre details */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#522874] text-sm">{item.product?.modelName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Size: {item.product?.size} • SKU: {item.product?.sku}
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.condition === "GOOD"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {item.condition === "GOOD" ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-green-600" /> Restocked
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-red-600" /> Defective
                          </>
                        )}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-4 px-6 text-center font-bold text-gray-800 text-sm">
                      {item.quantity}
                    </td>

                    {/* Credit Issued */}
                    <td className="py-4 px-6 text-right font-black text-green-600 text-sm whitespace-nowrap">
                      {`₹${formatNumber(item.refundAmount, 2)}`}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Only Admin can delete */}
                        {userRole === "ADMIN" && (
                          <button
                            onClick={() =>
                              setDeleteModal({
                                isOpen: true,
                                returnId: item.id,
                                customerName: item.customer?.name || "Customer",
                                refundAmount: item.refundAmount,
                              })
                            }
                            className="inline-flex items-center justify-center p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-all active:scale-95 cursor-pointer border border-red-100"
                            title="Reverse Return"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReturn(item)}
                          className="inline-flex items-center justify-center gap-1 bg-white border border-gray-200 text-gray-700 hover:text-[#522874] hover:border-[#522874] hover:bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" /> View <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedReturn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 bg-[#1a0a2e] text-white shrink-0">
              <div>
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <Undo2 className="w-5 h-5 text-purple-400" /> Sales Return Detail
                </h3>
                <p className="text-purple-200 text-xs">
                  ID: {selectedReturn.id} • Registered {format(new Date(selectedReturn.createdAt), "dd MMM yyyy, hh:mm a")}
                </p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-6">
              
              {/* Customer & Location Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Customer Details */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-800" /> Customer Information
                  </p>
                  <p className="font-extrabold text-gray-900 text-sm">{selectedReturn.customer?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Phone: {selectedReturn.customer?.phone || "N/A"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Type: <span className="uppercase text-purple-800 font-semibold">{selectedReturn.customer?.type?.replace("_", " ")}</span></p>
                  {selectedReturn.customer?.gstNumber && (
                    <p className="text-[10px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-mono mt-2 w-fit">
                      GSTIN: {selectedReturn.customer.gstNumber}
                    </p>
                  )}
                </div>

                {/* Return Details */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-800" /> Shop / Warehouse Location
                  </p>
                  <p className="font-extrabold text-gray-900 text-sm">{selectedReturn.location?.name}</p>
                  <p className="text-xs text-gray-500 mt-2">Processed By: <span className="font-bold text-gray-700">{selectedReturn.user?.fullName || "System Admin"}</span></p>
                </div>
              </div>

              {/* Product and Tyre Details */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-purple-50/50 px-4 py-3 border-b border-purple-100">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Tyre & Stock Restocking Info</h4>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">Product Model</span>
                    <span className="font-black text-gray-900 text-base">{selectedReturn.product?.modelName}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">Product Details</span>
                    <span className="text-sm font-semibold text-gray-700">
                      Brand: {selectedReturn.product?.brand} • Size: {selectedReturn.product?.size}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">Product SKU</span>
                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-50 border px-2 py-1 rounded w-fit block mt-1">
                      {selectedReturn.product?.sku}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">HSN Code</span>
                    <span className="text-xs font-bold text-gray-700 block mt-1">
                      {selectedReturn.product?.hsnCode || "4011"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Condition / Return Note */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase mb-1">Return Condition</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      selectedReturn.condition === "GOOD"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedReturn.condition === "GOOD" ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-green-700" /> Good Condition (Tyre was restocked to inventory)
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-700" /> Defective Tyre (Discarded from active stock / claim issued)
                      </>
                    )}
                  </span>
                </div>
                
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase mb-1">Remarks / Claim Reason</span>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium bg-gray-50 border p-3 rounded-lg">
                    {selectedReturn.reason || "No remarks provided."}
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
              <div className="text-left">
                <span className="text-xs font-bold text-gray-400 uppercase block">Quantity Returned</span>
                <span className="text-2xl font-black text-gray-900">{selectedReturn.quantity} Units</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Refund Amount Issued</span>
                <span className="text-3xl font-black text-green-600 flex items-center justify-end">
                  <IndianRupee className="w-6 h-6 inline" />
                  {formatNumber(selectedReturn.refundAmount, 2)}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

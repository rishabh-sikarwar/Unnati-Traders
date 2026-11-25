"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Loader2,
  Info,
  IndianRupee,
  Receipt,
  Truck,
  Sparkles,
  FileCheck,
} from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector";
import TransferChallanModal from "@/components/admin/transfer-challan-modal";
import { formatNumber, formatCurrency } from "@/lib/format";

export default function TransferStockForm({ products, locations }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [transferRate, setTransferRate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdTransfer, setCreatedTransfer] = useState(null);

  // --- DYNAMIC STOCK & SELECTION ---
  const selectedProduct = products.find((p) => p.id === productId);
  const sourceInventory = selectedProduct?.inventories?.find(
    (i) => i.locationId === fromLocation,
  );
  const availableStock = sourceInventory ? sourceInventory.quantity : 0;

  // Handle product selection & auto-fill last purchase cost
  const handleProductSelect = (id) => {
    setProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      const defaultRate =
        prod.lastPurchaseRate !== undefined && prod.lastPurchaseRate !== null
          ? prod.lastPurchaseRate
          : Number(prod.basePrice || 0);
      setTransferRate(defaultRate.toString());
    } else {
      setTransferRate("");
    }
  };

  const qtyNum = Number(quantity) || 0;
  const rateNum = Number(transferRate) || 0;
  const liveRowWorth = qtyNum * rateNum;

  const isTTF =
    Boolean(selectedProduct?.hasTube) || Boolean(selectedProduct?.hasFlap);

  async function transferStock(e) {
    e.preventDefault();

    if (
      !productId ||
      !fromLocation ||
      !toLocation ||
      !quantity ||
      qtyNum <= 0
    ) {
      return toast.error("Please fill in all details with a valid quantity");
    }

    if (fromLocation === toLocation) {
      return toast.error("Source and destination shop cannot be the same");
    }

    if (rateNum < 0) {
      return toast.error("Transfer rate cannot be negative");
    }

    // FRONTEND VALIDATION: Prevent transferring ghost stock
    if (qtyNum > availableStock) {
      return toast.error(
        `Not enough stock! You only have ${availableStock} available at the source shop.`,
      );
    }

    setLoading(true);
    const loadingToast = toast.loading("Executing Internal Transfer...");

    try {
      const res = await fetch("/api/transfer-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          fromLocation,
          toLocation,
          quantity: qtyNum,
          unitPrice: rateNum,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");

      toast.success("Stock transferred successfully! 🎉", { id: loadingToast });

      // Save for printable challan popup
      if (data.transfer) {
        setCreatedTransfer(data.transfer);
      }

      // Reset form fields
      setProductId("");
      setQuantity("");
      setTransferRate("");
      setNotes("");

      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {createdTransfer && (
        <TransferChallanModal
          transfer={createdTransfer}
          onClose={() => setCreatedTransfer(null)}
        />
      )}

      <form
        onSubmit={transferStock}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* --- SMART TYRE SELECTION --- */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase">
                Select Tyre Model
              </label>
              {selectedProduct && isTTF && (
                <span className="text-[11px] font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  TTF Set (Tyre + {selectedProduct.hasTube ? "Tube" : ""}{" "}
                  {selectedProduct.hasTube && selectedProduct.hasFlap ? "+" : ""}{" "}
                  {selectedProduct.hasFlap ? "Flap" : ""})
                </span>
              )}
            </div>
            <SmartTyreSelector
              products={products}
              selectedProductId={productId}
              onSelect={handleProductSelect}
            />

            {/* TTF Set Description Badge */}
            {selectedProduct && isTTF && (
              <div className="mt-2 text-xs bg-purple-50/70 text-purple-900 border border-purple-100 p-2.5 rounded-xl flex flex-wrap items-center gap-2">
                <span className="font-bold">Set Components:</span>
                <span className="bg-white px-2 py-0.5 rounded border border-purple-200">
                  Tyre: {selectedProduct.modelName}
                </span>
                {selectedProduct.hasTube && (
                  <span className="bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 font-semibold">
                    Tube: {selectedProduct.tubeName || "Apollo Tube"} (₹
                    {selectedProduct.tubePrice})
                  </span>
                )}
                {selectedProduct.hasFlap && (
                  <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800 font-semibold">
                    Flap: {selectedProduct.flapName || "Flap"} (₹
                    {selectedProduct.flapPrice})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* FROM SHOP */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Transfer From (Source Shop)
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none transition-all cursor-pointer bg-white text-sm font-semibold text-gray-900 shadow-sm"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
            >
              <option value="">-- Select Source Branch --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* TO SHOP */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Transfer To (Destination Shop)
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 outline-none transition-all cursor-pointer bg-white text-sm font-semibold text-gray-900 shadow-sm"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
            >
              <option value="">-- Select Destination Branch --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DYNAMIC STOCK DISPLAY */}
        {productId && fromLocation && (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between gap-2 ${
              availableStock === 0
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-amber-50 border border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">
                Available at source branch:{" "}
                <strong className="text-base font-black ml-1">
                  {availableStock} Tyres
                </strong>
              </span>
            </div>
            {availableStock === 0 && (
              <span className="text-xs font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded">
                Out of Stock
              </span>
            )}
          </div>
        )}

        {/* QUANTITY & VALUATION RATE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* QUANTITY */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Quantity to Move
            </label>
            <input
              type="number"
              min="1"
              max={availableStock > 0 ? availableStock : undefined}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none transition-all text-lg font-bold text-gray-900 disabled:opacity-50 shadow-sm"
              placeholder="e.g. 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={
                !productId || !fromLocation || !toLocation || availableStock === 0
              }
            />
          </div>

          {/* TRANSFER RATE (VALUATION) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase">
                Transfer Rate (₹ / Unit)
              </label>
              {selectedProduct?.lastPurchaseRate ? (
                <span className="text-[10px] text-gray-500 font-medium">
                  Auto-fetched from Apollo purchase
                </span>
              ) : null}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none transition-all text-lg font-bold text-gray-900 disabled:opacity-50 shadow-sm"
                placeholder="0.00"
                value={transferRate}
                onChange={(e) => setTransferRate(e.target.value)}
                disabled={!productId}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Exact inward cost snapshot for Shop B (no supplier bill duplication).
            </p>
          </div>
        </div>

        {/* REMARKS / NOTES */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Remarks / Delivery Challan Notes (Optional)
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none transition-all text-sm font-medium text-gray-800 shadow-sm"
            placeholder="e.g. Dispatched via Tempo DL-1AA-1234, Driver: Rajesh Kumar"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* LIVE WORTH PREVIEW BANNER */}
        {qtyNum > 0 && rateNum > 0 && (
          <div className="bg-gradient-to-r from-purple-50 via-purple-100/50 to-indigo-50 border border-purple-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-700">
                <Receipt className="w-4 h-4" />
                Live Valuation Preview
              </div>
              <div className="text-sm text-gray-700 font-medium">
                {qtyNum} units × ₹{formatNumber(rateNum, 2)} per tyre
                {isTTF ? " (TTF Set)" : ""}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                Total Transfer Worth
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#522874]">
                ₹{formatNumber(liveRowWorth, 2)}
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || availableStock === 0 || qtyNum <= 0}
            className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Transfer...</span>
              </>
            ) : (
              <>
                <Truck className="w-5 h-5" />
                <span>Execute Transfer & Generate Challan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}

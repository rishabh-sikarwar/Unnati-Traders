"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Loader2, Info } from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector"; // <--- PLUGGED IN HERE

export default function TransferStockForm({ products, locations }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  // --- DYNAMIC STOCK CALCULATION ---
  // How much stock is actually sitting in the 'fromLocation'?
  const selectedProduct = products.find((p) => p.id === productId);
  const sourceInventory = selectedProduct?.inventories?.find(
    (i) => i.locationId === fromLocation,
  );
  const availableStock = sourceInventory ? sourceInventory.quantity : 0;

  async function transferStock(e) {
    e.preventDefault();
    const qtyNum = Number(quantity);

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

    // FRONTEND VALIDATION: Prevent transferring ghost stock
    if (qtyNum > availableStock) {
      return toast.error(
        `Not enough stock! You only have ${availableStock} available at the source shop.`,
      );
    }

    setLoading(true);
    const loadingToast = toast.loading("Executing Transfer...");

    try {
      const res = await fetch("/api/transfer-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          fromLocation,
          toLocation,
          quantity: qtyNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");

      toast.success("Stock transferred successfully! 🎉", { id: loadingToast });

      // Reset form fields
      setProductId("");
      setFromLocation("");
      setToLocation("");
      setQuantity("");

      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={transferStock}
      className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- SMART TYRE SELECTION --- */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Select Tyre Model
          </label>
          <SmartTyreSelector
            products={products}
            selectedProductId={productId}
            onSelect={setProductId}
          />
        </div>

        {/* FROM */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Transfer From
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer bg-white"
            value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)}
          >
            <option value="">-- Source Shop --</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* TO */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Transfer To
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all cursor-pointer bg-white"
            value={toLocation}
            onChange={(e) => setToLocation(e.target.value)}
          >
            <option value="">-- Destination Shop --</option>
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
          className={`p-3 rounded-lg flex items-center gap-2 ${availableStock === 0 ? "bg-red-50 text-red-800 border border-red-100" : "bg-orange-50 border border-orange-100 text-orange-800"}`}
        >
          <Info className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">
            Available stock at source shop:{" "}
            <strong className="text-lg ml-1">{availableStock}</strong>
          </span>
        </div>
      )}

      {/* QUANTITY */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
          Quantity to Move
        </label>
        <input
          type="number"
          min="1"
          className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all text-lg font-medium disabled:opacity-50"
          placeholder="e.g. 10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={
            !productId || !fromLocation || !toLocation || availableStock === 0
          }
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading || availableStock === 0}
          className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white px-6 py-3.5 rounded-lg font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
          Execute Transfer
        </button>
      </div>
    </form>
  );
}

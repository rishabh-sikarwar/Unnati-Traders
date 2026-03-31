"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Minus, Loader2, Package } from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector"; // <--- IMPORT IT HERE

export default function ManageStockForm({ products, locations }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loadingType, setLoadingType] = useState(null);

  // Dynamic stock calculation stays here, because it's specific to managing stock
  const selectedProduct = products.find((p) => p.id === productId);
  const currentInventory = selectedProduct?.inventories?.find(
    (i) => i.locationId === locationId,
  );
  const currentStock = currentInventory ? currentInventory.quantity : 0;

  async function updateStock(e, type) {
    e.preventDefault();
    const qtyNum = Number(quantity);

    if (!productId || !locationId || !quantity || qtyNum <= 0) {
      return toast.error("Please fill all fields with a valid quantity");
    }

    if (type === "remove" && qtyNum > currentStock) {
      return toast.error(
        `Cannot remove ${qtyNum}. You only have ${currentStock} in stock here.`,
      );
    }

    setLoadingType(type);
    const loadingToast = toast.loading(
      type === "add" ? "Adding stock..." : "Removing stock...",
    );

    try {
      const res = await fetch("/api/inventory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, locationId, quantity: qtyNum, type }),
      });

      if (!res.ok) throw new Error("Database update failed");

      toast.success(
        `Successfully ${type === "add" ? "added" : "removed"} stock!`,
        { id: loadingToast },
      );

      // Reset form
      setQuantity("");
      setProductId(""); // <--- This will now automatically clear your new Smart Search bar!
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoadingType(null);
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="space-y-5">
        {/* --- PLUG IN YOUR NEW COMPONENT HERE --- */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Select Tyre
          </label>
          <SmartTyreSelector
            products={products}
            selectedProductId={productId}
            onSelect={setProductId}
          />
        </div>

        {/* SHOP SELECTION */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Select Target Shop
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all cursor-pointer bg-white"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">-- Choose Location --</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* --- PROMINENT CURRENT STOCK METER --- */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <Package className="w-6 h-6 text-[#522874]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">
                Current Stock
              </label>
              <p className="text-sm text-gray-500">
                Available at selected location
              </p>
            </div>
          </div>
          <div className="text-4xl font-black text-[#522874]">
            {productId && locationId ? (
              <span
                className={
                  currentStock === 0 ? "text-red-500" : "text-[#522874]"
                }
              >
                {currentStock}
              </span>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </div>
        </div>

        {/* QUANTITY INPUT */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Adjustment Quantity
          </label>
          <input
            type="number"
            min="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all text-lg font-medium disabled:opacity-50 disabled:bg-gray-50"
            placeholder="e.g. 50"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={!productId || !locationId} // Disable if tyre/shop aren't selected
          />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={(e) => updateStock(e, "add")}
          disabled={loadingType !== null || !productId || !locationId}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-lg font-bold transition-all duration-300 cursor-pointer flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingType === "add" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          Add Stock In
        </button>

        <button
          onClick={(e) => updateStock(e, "remove")}
          disabled={
            loadingType !== null ||
            !productId ||
            !locationId ||
            currentStock === 0
          }
          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3.5 rounded-lg font-bold transition-all duration-300 cursor-pointer flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingType === "remove" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Minus className="w-5 h-5" />
          )}
          Remove Stock Out
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Loader2 } from "lucide-react";

export default function TransferStockForm({ products, locations }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  async function transferStock(e) {
    e.preventDefault();
    if (!productId || !fromLocation || !toLocation || !quantity) {
      return toast.error("Please fill in all details");
    }

    if (fromLocation === toLocation) {
      return toast.error("Source and destination shop cannot be the same");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transfer-stock", {
        method: "POST",
        body: JSON.stringify({
          productId,
          fromLocation,
          toLocation,
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      toast.success("Stock transferred successfully! 🎉");

      // Reset form
      setProductId("");
      setFromLocation("");
      setToLocation("");
      setQuantity("");

      router.refresh();
    } catch (error) {
      toast.error(error.message);
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
        {/* PRODUCT */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Select Tyre Model
          </label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all cursor-pointer bg-white"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">-- Choose a Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.modelName} ({p.size}) - {p.sku}
              </option>
            ))}
          </select>
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

      {/* QUANTITY */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
          Quantity to Move
        </label>
        <input
          type="number"
          min="1"
          className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all text-lg font-medium"
          placeholder="e.g. 10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white px-6 py-3.5 rounded-lg font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
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

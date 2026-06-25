"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Undo2, User, Package, AlertCircle, MapPin, IndianRupee, Hash, FileText } from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector";

export default function ReturnForm({ customers, products, locations, userId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [refundAmount, setRefundAmount] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId || !productId || !locationId || !refundAmount) {
      return toast.error("Please fill all required fields.");
    }

    setLoading(true);
    const loadingToast = toast.loading("Processing Return & Credit Note...");

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          productId,
          locationId,
          userId,
          quantity: Number(quantity),
          refundAmount: Number(refundAmount),
          condition,
          reason,
        }),
      });

      if (!res.ok) throw new Error("Failed to process return");

      toast.success("Return Processed & Khata Updated!", { id: loadingToast });
      router.push("/returns/history"); // Redirect to history to see the log!
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 2-Column Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Customer / Location Info */}
        <div className="space-y-5 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2 text-sm uppercase tracking-wider text-purple-950">
            <User className="w-4 h-4 text-[#522874]" /> Customer & Location
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              Select Customer / Dealer <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none text-gray-700 font-medium transition-all"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Return To Location <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none text-gray-700 font-medium transition-all"
            >
              <option value="">-- Choose Location --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product / Qty Info */}
        <div className="space-y-5 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2 text-sm uppercase tracking-wider text-purple-950">
            <Package className="w-4 h-4 text-[#522874]" /> Product & Amount
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Select Returned Tyre <span className="text-red-500">*</span>
            </label>
            <SmartTyreSelector products={products} selectedProductId={productId} onSelect={setProductId} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Quantity <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none text-gray-800 font-bold transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" /> Refund Amount <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min="1"
                placeholder="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none text-gray-800 font-bold transition-all"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Condition & Details */}
      <div className="bg-purple-50/30 p-6 rounded-2xl border border-purple-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider text-purple-950">
          <AlertCircle className="w-4 h-4 text-orange-500" /> Return Condition & Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Tyre Condition</label>
            <div className="flex gap-4">
              <label
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-98 ${
                  condition === "GOOD"
                    ? "border-green-500 bg-green-50/50 text-green-700 font-bold"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="GOOD"
                  checked={condition === "GOOD"}
                  onChange={() => setCondition("GOOD")}
                  className="hidden"
                />
                <span className="text-sm">Good Condition</span>
                <span className="text-[10px] opacity-70 mt-0.5 font-normal">Add to stock</span>
              </label>
              <label
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-98 ${
                  condition === "DEFECTIVE"
                    ? "border-red-500 bg-red-50/50 text-red-700 font-bold"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="DEFECTIVE"
                  checked={condition === "DEFECTIVE"}
                  onChange={() => setCondition("DEFECTIVE")}
                  className="hidden"
                />
                <span className="text-sm">Defective (Claim)</span>
                <span className="text-[10px] opacity-70 mt-0.5 font-normal">Keep out of stock</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Reason / Remarks
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Size mismatch, Claim warrant, Manufacturing issue..."
                rows={2}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none text-gray-700 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 shadow-md"
      >
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Undo2 className="w-6 h-6" />}
        Process Return & Issue Credit Note
      </button>
    </form>
  );
}
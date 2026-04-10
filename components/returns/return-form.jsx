"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Undo2, User, Package, AlertCircle } from "lucide-react";
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
          customerId, productId, locationId, userId,
          quantity: Number(quantity),
          refundAmount: Number(refundAmount),
          condition, reason
        }),
      });

      if (!res.ok) throw new Error("Failed to process return");

      toast.success("Return Processed & Khata Updated!", { id: loadingToast });
      router.push("/customers"); // Redirect to Khata to see the reduced balance!
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Selection */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2"><User className="w-5 h-5 text-[#522874]"/> Select Customer / Dealer</h3>
          <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none">
            <option value="">-- Choose Customer --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No Phone'})</option>)}
          </select>

          <label className="block text-xs font-bold text-gray-500 uppercase mt-4 mb-1">Return To Shop/Warehouse</label>
          <select required value={locationId} onChange={e => setLocationId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none">
            <option value="">-- Choose Location --</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        {/* Product Selection */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2"><Package className="w-5 h-5 text-[#522874]"/> Select Returned Tyre</h3>
          <SmartTyreSelector products={products} selectedProductId={productId} onSelect={setProductId} />
          
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
              <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none" />
            </div>
            <div className="flex-[2]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Credit Amount (₹)</label>
              <input required type="number" min="1" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="Total amount to refund" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Condition & Details */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><AlertCircle className="w-5 h-5 text-orange-500"/> Return Condition & Notes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tyre Condition</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${condition === 'GOOD' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <input type="radio" name="condition" value="GOOD" checked={condition === 'GOOD'} onChange={() => setCondition('GOOD')} className="hidden" />
                <span className="font-bold">Good (Restock)</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${condition === 'DEFECTIVE' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <input type="radio" name="condition" value="DEFECTIVE" checked={condition === 'DEFECTIVE'} onChange={() => setCondition('DEFECTIVE')} className="hidden" />
                <span className="font-bold">Defective (Claim)</span>
              </label>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">"Good" will add the tyre back to your inventory. "Defective" will keep it out of stock.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason / Remarks</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Wrong size ordered, Manufacturing defect..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-md">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Undo2 className="w-6 h-6" />} Process Return & Update Khata
      </button>
    </form>
  );
}
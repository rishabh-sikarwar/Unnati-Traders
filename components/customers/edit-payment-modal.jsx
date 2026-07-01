"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, X, Edit3, IndianRupee, MessageSquare } from "lucide-react";

export default function EditPaymentModal({ payment, onClose, onSuccess }) {
  const [amount, setAmount] = useState(payment.credit !== undefined && payment.credit !== null ? String(payment.credit) : "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount === "" || isNaN(Number(amount)) || Number(amount) < 0) {
      return toast.error("Please enter a valid amount.");
    }

    setLoading(true);
    const toastId = toast.loading("Saving changes & updating audit trail...");

    try {
      const res = await fetch(`/api/payments/${payment.rawId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update payment");

      toast.success("Payment updated successfully!", { id: toastId });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#1a0a2e] text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-400" /> Edit Payment Log
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Payment Context Card */}
          <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl space-y-1 text-sm text-gray-700">
            <p>
              <strong className="text-gray-500 font-bold uppercase text-[10px] block mb-0.5">Original Date</strong>
              <span className="font-semibold">
                {new Date(payment.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
            <p className="pt-1.5 border-t border-purple-100/50">
              <strong className="text-gray-500 font-bold uppercase text-[10px] block mb-0.5">Payment Mode</strong>
              <span className="font-bold text-[#522874] uppercase tracking-wider">{payment.paymentMode}</span>
            </p>
          </div>

          {/* New Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" /> New Credit Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none text-lg font-black text-gray-800 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Edit Reason Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Reason for Correction
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="e.g. Typo in amount, incorrect note"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none text-sm text-gray-800 transition-all disabled:opacity-50"
            />
            <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-tight">
              An audit entry record `[Edited on DD-MMM-YYYY: Orig. ₹{payment.credit}] {reason || 'Reason'}` will be permanently appended to payment remarks.
            </p>
          </div>

          {/* Modal Buttons */}
          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 active:scale-98"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#522874] hover:bg-[#3d1d56] text-white rounded-xl font-black transition-all flex justify-center items-center gap-2 shadow-sm cursor-pointer disabled:opacity-75 active:scale-98"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function CustomerPaymentAction({
  orderId,
  status,
  paymentReference: initialRef = "",
}) {
  const router = useRouter();
  const [utrNumber, setUtrNumber] = useState(initialRef || "");
  const [loading, setLoading] = useState(false);

  const handleSubmitPayment = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/dealer-orders/${orderId}/submit-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference: utrNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payment confirmation");
      }

      toast.success("Payment submitted! The shopkeeper will verify credit shortly.", {
        duration: 5000,
      });
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to submit payment confirmation");
    } finally {
      setLoading(false);
    }
  };

  if (status === "PAYMENT_SUBMITTED") {
    return (
      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-left space-y-1.5 shadow-2xs animate-in fade-in">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Payment Claimed • Verification Pending</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          The shopkeeper has been notified and will verify the bank credit shortly.
        </p>
        {initialRef && (
          <div className="pt-1.5 mt-1.5 border-t border-amber-200/70 flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <span className="text-amber-700">Submitted UTR / Ref:</span>
            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
              {initialRef}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (status === "BILLED") {
    return (
      <form onSubmit={handleSubmitPayment} className="space-y-2.5 text-left pt-1">
        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            UPI Reference / UTR Number <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 428910284729 or last digits"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-purple-200 bg-white rounded-lg focus:ring-2 focus:ring-[#522874] focus:outline-none transition-all placeholder:text-gray-400 font-mono"
            maxLength={30}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>I Have Made the Payment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>
    );
  }

  return null;
}

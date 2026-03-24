"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Minus, Loader2 } from "lucide-react";

export default function UpdateStock({ productId, locationId, currentQty }) {
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(type) {
    const quantityToChange = Number(qty);

    if (!qty || quantityToChange <= 0) {
      return toast.error("Please enter a valid quantity (1 or more)");
    }
    if (type === "remove" && quantityToChange > currentQty) {
      return toast.error(
        `Cannot remove ${quantityToChange}. Only ${currentQty} in stock.`,
      );
    }

    setLoading(true);
    const loadingToast = toast.loading("Updating inventory...");

    try {
      const res = await fetch("/api/inventory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          locationId,
          quantity: quantityToChange,
          type,
        }),
      });

      if (!res.ok) throw new Error("Failed to update database");

      toast.success("Stock updated successfully!", { id: loadingToast });
      setQty(""); // Clear the input field after success
      router.refresh(); // Instantly update the Server Component data without blinking
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-auto">
      <input
        type="number"
        min="1"
        placeholder="Qty"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[#522874] focus:border-transparent transition-all"
        disabled={loading}
      />

      {/* Add Stock Button */}
      <Button
        onClick={() => update("add")}
        disabled={loading || !qty}
        className="bg-green-600 hover:bg-green-700 text-white h-9 w-10 p-0 rounded-lg cursor-pointer transition-transform active:scale-95 disabled:opacity-50 shrink-0 shadow-sm"
        title="Add to stock"
      >
        {loading ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </Button>

      {/* Remove Stock Button */}
      <Button
        onClick={() => update("remove")}
        disabled={loading || currentQty === 0 || !qty}
        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 h-9 w-10 p-0 rounded-lg cursor-pointer transition-transform active:scale-95 disabled:opacity-50 shrink-0 shadow-sm"
        title="Remove from stock"
      >
        <Minus className="w-5 h-5" />
      </Button>
    </div>
  );
}

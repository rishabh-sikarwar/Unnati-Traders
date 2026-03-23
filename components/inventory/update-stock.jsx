"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Minus, Loader2 } from "lucide-react";

export default function UpdateStock({ productId, locationId, currentQty }) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(type) {
    if (qty <= 0) return toast.error("Quantity must be at least 1");

    setLoading(true);
    const loadingToast = toast.loading("Updating stock...");

    try {
      const res = await fetch("/api/inventory/update", {
        method: "POST",
        body: JSON.stringify({
          productId,
          locationId,
          quantity: Number(qty),
          type,
        }),
      });

      if (res.ok) {
        toast.success("Stock updated successfully", { id: loadingToast });
        setQty(1); // Reset input
        router.refresh(); // This updates the server component data without reloading!
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      toast.error("Stock update failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-auto">
      <div className="relative">
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-20 border-2 border-gray-300 rounded-lg p-2 font-bold text-center outline-none focus:border-[#522874] transition-all"
        />
      </div>

      <Button
        onClick={() => update("add")}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 h-10 w-10 p-0 rounded-lg cursor-pointer transition-transform active:scale-90"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Plus size={20} />
        )}
      </Button>

      <Button
        onClick={() => update("remove")}
        disabled={loading || currentQty === 0}
        className="bg-red-600 hover:bg-red-700 h-10 w-10 p-0 rounded-lg cursor-pointer transition-transform active:scale-90"
      >
        <Minus size={20} />
      </Button>
    </div>
  );
}

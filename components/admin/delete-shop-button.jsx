"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteShopButton({ id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteShop() {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this location?",
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Could not delete shop");

      toast.success("Location deleted");
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={deleteShop}
      disabled={loading}
      className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      Delete
    </button>
  );
}

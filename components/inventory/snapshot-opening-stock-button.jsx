"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SnapshotOpeningStockButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    const loadingToast = toast.loading("Updating opening stock snapshot...");

    try {
      const response = await fetch("/api/cron/snapshot-stock", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to update opening stock snapshot");
      }

      toast.success("Opening stock snapshot updated successfully!", { id: loadingToast });
      router.refresh();
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Snapshot update failed";
      toast.error(errMsg, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-auto">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-amber-600 transition-all shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-80"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Sparkles size={18} />
        )}
        {loading ? "Saving Snapshot..." : "Set Opening Stock"}
      </button>
    </div>
  );
}

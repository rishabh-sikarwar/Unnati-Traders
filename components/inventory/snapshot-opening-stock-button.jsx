"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SnapshotOpeningStockButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cron/snapshot-stock", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to update opening stock snapshot");
      }

      setMessage("Opening stock updated");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Snapshot update failed",
      );
    } finally {
      setLoading(false);
      window.setTimeout(() => setMessage(""), 3000);
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
      {message ? (
        <p className="mt-2 text-xs font-semibold text-gray-500">{message}</p>
      ) : null}
    </div>
  );
}

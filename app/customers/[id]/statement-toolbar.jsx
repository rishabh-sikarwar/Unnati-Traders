"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Loader2 } from "lucide-react";

export default function StatementToolbar({ initialDate, initialStart, initialEnd }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dateFilter, setDateFilter] = useState(initialDate || "all");
  const [customStart, setCustomStart] = useState(initialStart || "");
  const [customEnd, setCustomEnd] = useState(initialEnd || "");

  const handleApply = (date, start, end) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", date);
    if (date === "custom") {
      if (start) params.set("start", start);
      else params.delete("start");
      if (end) params.set("end", end);
      else params.delete("end");
    } else {
      params.delete("start");
      params.delete("end");
    }
    startTransition(() => {
      router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200 items-start sm:items-center w-full mb-6 print:hidden">
      <div className="flex items-center gap-1.5 text-[#522874] font-bold text-xs uppercase tracking-widest pl-2">
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#522874]" />
        ) : (
          <Filter className="w-4 h-4" />
        )}
        {isPending ? "Updating..." : "Filter Period:"}
      </div>
      
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <select
          value={dateFilter}
          onChange={(e) => {
            const val = e.target.value;
            setDateFilter(val);
            if (val !== "custom") {
              handleApply(val, "", "");
            }
          }}
          className="flex-1 sm:flex-none px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
        >
          <option value="all">All Time</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="custom">Custom Range...</option>
        </select>

        {dateFilter === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                if (customEnd) handleApply("custom", e.target.value, customEnd);
              }}
              className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                if (customStart) handleApply("custom", customStart, e.target.value);
              }}
              className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

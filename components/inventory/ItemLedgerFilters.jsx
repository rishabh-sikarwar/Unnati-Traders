"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Filter, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ItemLedgerFilters({ locations }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const locationFilter = searchParams.get("location") || "ALL";
  const dateFilter = searchParams.get("date") || "this_month";
  const customStart = searchParams.get("start") || "";
  const customEnd = searchParams.get("end") || "";

  const [localStart, setLocalStart] = useState(customStart);
  const [localEnd, setLocalEnd] = useState(customEnd);

  const updateFilters = useCallback(
    (key, value) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }

        if (key === "date" && value !== "custom") {
          params.delete("start");
          params.delete("end");
          setLocalStart("");
          setLocalEnd("");
        }

        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (dateFilter === "custom" && localStart && localEnd) {
      if (localStart !== customStart || localEnd !== customEnd) {
        startTransition(() => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("start", localStart);
          params.set("end", localEnd);
          router.push(`?${params.toString()}`, { scroll: false });
        });
      }
    }
  }, [localStart, localEnd, dateFilter, customStart, customEnd, router, searchParams]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm relative overflow-hidden animate-in fade-in duration-500">
      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <Loader2 className="h-6 w-6 animate-spin text-[#522874]" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-auto text-xs font-bold uppercase text-gray-500 tracking-wider">
          Filters
        </div>

        {/* LOCATION FILTER */}
        <div className="flex-1 w-full sm:w-auto">
          <Select value={locationFilter} onValueChange={(value) => updateFilters("location", value)}>
            <SelectTrigger className="w-full h-10 border-gray-300 rounded-xl focus:ring-[#522874] shadow-sm font-semibold text-gray-700 bg-white">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Select Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Shops &amp; Warehouses</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* DATE FILTER */}
        <div className="flex-1 w-full sm:w-auto">
          <Select value={dateFilter} onValueChange={(value) => updateFilters("date", value)}>
            <SelectTrigger className="w-full h-10 border-gray-300 rounded-xl focus:ring-[#522874] shadow-sm font-semibold text-gray-700 bg-white">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Select Date Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CUSTOM DATE RANGE */}
        {dateFilter === "custom" && (
          <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-left-4 duration-300">
            <input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-[#522874] outline-none shadow-sm flex-1 bg-white"
            />
            <span className="text-gray-400 font-medium">to</span>
            <input
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-[#522874] outline-none shadow-sm flex-1 bg-white"
            />
          </div>
        )}
      </div>
    </section>
  );
}

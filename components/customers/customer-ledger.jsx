"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  IndianRupee,
  HandCoins,
  X,
  ArchiveX,
  FileText,
  Filter,
  Wallet,
  Landmark,
  Banknote,
  Smartphone,
  CircleDollarSign,
  RotateCcw,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import { toDecimal, moneyToString } from "@/lib/money";

export default function CustomerLedger({
  customers,
  globalOutstanding,
  analytics,
  locations = [],
  userId,
  currentFilters,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // URL Filter States
  const [searchQuery, setSearchQuery] = useState(
    currentFilters.searchQuery || "",
  );
  const [dateFilter, setDateFilter] = useState(
    currentFilters.dateFilter || "this_month",
  );
  const [shopFilter, setShopFilter] = useState(
    currentFilters.shopFilter || "ALL",
  );
  const [filterDuesOnly, setFilterDuesOnly] = useState(
    currentFilters.duesOnly || false,
  );
  const [filterArchived, setFilterArchived] = useState(
    currentFilters.archived || false,
  );

  // Custom Date States
  const [customStart, setCustomStart] = useState(
    currentFilters.customStart || "",
  );
  const [customEnd, setCustomEnd] = useState(currentFilters.customEnd || "");

  // Safe Analytics Stats
  const stats = analytics || {
    filteredMarketDues: globalOutstanding || 0,
    duesRecovered: 0,
    settlementCount: 0,
    cashRecovered: 0,
    upiRecovered: 0,
    bankRecovered: 0,
    newCreditGiven: 0,
    creditBillsCount: 0,
  };

  // Modal States
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    customer: null,
  });
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("CASH");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [openingModal, setOpeningModal] = useState({
    isOpen: false,
    customer: null,
  });
  const [openingAmount, setOpeningAmount] = useState("");
  const [isOpeningSubmitting, setIsOpeningSubmitting] = useState(false);

  const [archiveModal, setArchiveModal] = useState({
    isOpen: false,
    customer: null,
    customerId: null,
    customerName: "",
  });
  const [isArchiving, setIsArchiving] = useState(false);

  const [restoreModal, setRestoreModal] = useState({
    isOpen: false,
    customer: null,
    customerName: "",
  });
  const [isRestoring, setIsRestoring] = useState(false);

  // --- TRIGGER SERVER RE-FETCH ---
  const applyFilters = (search, date, shop, dues, archived, start, end) => {
    startTransition(() => {
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (date) params.set("date", date);
      if (shop && shop !== "ALL") params.set("shopId", shop);
      if (dues) params.set("duesOnly", "true");
      if (archived) params.set("archived", "true");
      if (date === "custom" && start && end) {
        params.set("start", start);
        params.set("end", end);
      }

      const queryString = params.toString();
      router.replace(queryString ? `/customers?${queryString}` : "/customers", {
        scroll: false,
      });
    });
  };

  // --- API CALLS ---
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payAmount || toDecimal(payAmount).lte(0))
      return toast.error("Enter a valid amount");
    if (toDecimal(payAmount).gt(paymentModal.customer.outstandingDues))
      return toast.error("Amount exceeds outstanding dues!");

    setIsSubmitting(true);
    const loadingToast = toast.loading("Processing payment...");

    try {
      const res = await fetch("/api/customers/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: paymentModal.customer.id,
          amount: moneyToString(payAmount),
          paymentMode: payMode,
          remarks: remarks,
          userId: userId,
        }),
      });

      if (!res.ok) throw new Error("Payment failed to process");

      toast.success("Payment recorded successfully!", { id: loadingToast });
      setPaymentModal({ isOpen: false, customer: null });
      setPayAmount("");
      setRemarks("");
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeArchive = async () => {
    if (!archiveModal.customer) return;
    setIsArchiving(true);
    const toastId = toast.loading("Archiving account...");

    try {
      const res = await fetch("/api/customers/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds: archiveModal.customer.ids,
          isArchived: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to archive");

      toast.success(`${archiveModal.customerName} archived successfully.`, {
        id: toastId,
      });
      setArchiveModal({ isOpen: false, customer: null, customerId: null, customerName: "" });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsArchiving(false);
    }
  };

  const executeRestore = async () => {
    if (!restoreModal.customer) return;
    setIsRestoring(true);
    const toastId = toast.loading("Restoring account...");

    try {
      const res = await fetch("/api/customers/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds: restoreModal.customer.ids,
          isArchived: false,
        }),
      });

      if (!res.ok) throw new Error("Failed to restore customer");

      toast.success(`${restoreModal.customerName} restored to active Khata!`, {
        id: toastId,
      });
      setRestoreModal({ isOpen: false, customer: null, customerName: "" });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpeningBalance = async (e) => {
    e.preventDefault();

    if (!openingModal.customer) return;
    if (openingAmount === "") return toast.error("Enter previous due amount");
    if (toDecimal(openingAmount).lt(0))
      return toast.error("Previous due cannot be negative");

    setIsOpeningSubmitting(true);
    const loadingToast = toast.loading("Updating previous due...");

    try {
      const res = await fetch("/api/customers/opening-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds: openingModal.customer.ids,
          amount: moneyToString(openingAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to update previous due");

      toast.success("Previous due updated successfully", { id: loadingToast });
      setOpeningModal({ isOpen: false, customer: null });
      setOpeningAmount("");
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsOpeningSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SERVER-SIDE SECURE TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 items-start xl:items-center">
        {/* Search Bar - Press Enter to Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search Name or Phone..."
            value={searchQuery}
            onChange={(e) => {
              const nextSearch = e.target.value;
              setSearchQuery(nextSearch);
              applyFilters(
                nextSearch,
                dateFilter,
                shopFilter,
                filterDuesOnly,
                filterArchived,
                customStart,
                customEnd,
              );
            }}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all font-medium text-gray-700"
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <Loader2 className="w-5 h-5 text-[#522874] animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="hidden sm:flex items-center gap-1.5 text-[#522874] font-bold text-xs uppercase tracking-widest pl-2">
            <Filter className="w-4 h-4" /> Filters:
          </div>

          {/* ADVANCED DATE FILTER */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              applyFilters(
                searchQuery,
                e.target.value,
                shopFilter,
                filterDuesOnly,
                filterArchived,
                customStart,
                customEnd,
              );
            }}
            className="flex-1 sm:flex-none px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
          >
            <option value="this_month">This Month</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_month">Last Month</option>
            <option value="custom">Custom Range...</option>
            <option value="all">All Time</option>
          </select>

          {/* CUSTOM DATE PICKERS */}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <input
                type="date"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  if (customEnd)
                    applyFilters(
                      searchQuery,
                      "custom",
                      shopFilter,
                      filterDuesOnly,
                      filterArchived,
                      e.target.value,
                      customEnd,
                    );
                }}
                className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  if (customStart)
                    applyFilters(
                      searchQuery,
                      "custom",
                      shopFilter,
                      filterDuesOnly,
                      filterArchived,
                      customStart,
                      e.target.value,
                    );
                }}
                className="px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium outline-none"
              />
            </div>
          )}

          {locations && locations.length > 0 && (
            <select
              value={shopFilter}
              onChange={(e) => {
                setShopFilter(e.target.value);
                applyFilters(
                  searchQuery,
                  dateFilter,
                  e.target.value,
                  filterDuesOnly,
                  filterArchived,
                  customStart,
                  customEnd,
                );
              }}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#522874] cursor-pointer"
            >
              <option value="ALL">All Shops</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              const newDuesState = !filterDuesOnly;
              setFilterDuesOnly(newDuesState);
              applyFilters(
                searchQuery,
                dateFilter,
                shopFilter,
                newDuesState,
                filterArchived,
                customStart,
                customEnd,
              );
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer active:scale-95 ${filterDuesOnly ? "bg-red-50 text-red-600 border-red-200 shadow-inner" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
          >
            {filterDuesOnly ? "Dues Only: ON" : "Dues Only: OFF"}
          </button>

          {/* ARCHIVED CUSTOMERS TOGGLE */}
          <button
            onClick={() => {
              const newArchivedState = !filterArchived;
              setFilterArchived(newArchivedState);
              applyFilters(
                searchQuery,
                dateFilter,
                shopFilter,
                filterDuesOnly,
                newArchivedState,
                customStart,
                customEnd,
              );
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer active:scale-95 ${
              filterArchived
                ? "bg-amber-100 text-amber-900 border-amber-300 shadow-inner ring-1 ring-amber-300"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {filterArchived ? "Archived: ON" : "Archived: OFF"}
          </button>
        </div>
      </div>

      {/* ANALYTICS SUMMARY KPI GRID */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#522874] animate-pulse" />
            <h2 className="text-xs font-bold text-[#522874] uppercase tracking-wider">
              Selected Timeline Analytics
            </h2>
          </div>
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-3">
            {stats.settlementCount > 0 && (
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
                {stats.settlementCount} Settlement{stats.settlementCount === 1 ? "" : "s"}
              </span>
            )}
            <span>
              Net Recovery vs Credit:{" "}
              <strong className={stats.duesRecovered >= stats.newCreditGiven ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                {stats.duesRecovered >= stats.newCreditGiven ? "+" : "-"}₹{formatNumber(Math.abs(stats.duesRecovered - stats.newCreditGiven), 0)}
              </strong>
            </span>
          </div>
        </div>

        {/* 6 KPI Cards Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. FILTERED MARKET DUES */}
          <div className="bg-red-50/50 border border-red-100 hover:border-red-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
                Filtered Market Dues
              </span>
              <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-red-950">
              ₹{formatNumber(stats.filteredMarketDues, 2)}
            </div>
            <div className="text-[11px] text-red-700 font-medium mt-1">
              Total Outstanding Balance
            </div>
          </div>

          {/* 2. TOTAL DUES RECOVERED */}
          <div className="bg-purple-50/60 border border-purple-200 hover:border-purple-300 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#522874] uppercase tracking-wider">
                Total Dues Recovered
              </span>
              <div className="p-1.5 bg-purple-100 text-[#522874] rounded-lg">
                <HandCoins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#522874]">
              ₹{formatNumber(stats.duesRecovered, 2)}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-1">
              {stats.settlementCount} payment {stats.settlementCount === 1 ? "entry" : "entries"}
            </div>
          </div>

          {/* 3. CASH COLLECTION */}
          <div className="bg-emerald-50/50 border border-emerald-100 hover:border-emerald-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Cash Collection
              </span>
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950">
              ₹{formatNumber(stats.cashRecovered, 2)}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              {stats.duesRecovered > 0 ? ((stats.cashRecovered / stats.duesRecovered) * 100).toFixed(1) : "0.0"}% of recovered
            </div>
          </div>

          {/* 4. UPI COLLECTION */}
          <div className="bg-blue-50/50 border border-blue-100 hover:border-blue-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                UPI Collection
              </span>
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-950">
              ₹{formatNumber(stats.upiRecovered, 2)}
            </div>
            <div className="text-[11px] text-blue-700 font-medium mt-1">
              {stats.duesRecovered > 0 ? ((stats.upiRecovered / stats.duesRecovered) * 100).toFixed(1) : "0.0"}% of recovered
            </div>
          </div>

          {/* 5. CHEQUE / BANK */}
          <div className="bg-amber-50/50 border border-amber-100 hover:border-amber-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Cheque / Bank / Card
              </span>
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950">
              ₹{formatNumber(stats.bankRecovered, 2)}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              {stats.duesRecovered > 0 ? ((stats.bankRecovered / stats.duesRecovered) * 100).toFixed(1) : "0.0"}% of recovered
            </div>
          </div>

          {/* 6. NEW CREDIT GIVEN */}
          <div className="bg-rose-50/50 border border-rose-100 hover:border-rose-200 rounded-xl p-3.5 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                New Credit Given
              </span>
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <CircleDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-950">
              ₹{formatNumber(stats.newCreditGiven, 2)}
            </div>
            <div className="text-[11px] text-rose-700 font-medium mt-1">
              {stats.creditBillsCount || 0} credit bills generated
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[0.5px] z-10 flex items-center justify-center transition-all duration-300 animate-in fade-in">
            <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 font-bold text-sm text-[#522874]">
              <Loader2 className="w-4 h-4 animate-spin text-[#522874]" /> Loading updated ledger...
            </div>
          </div>
        )}
        <div className={`transition-all duration-200 ${isPending ? "opacity-60 pointer-events-none blur-[0.5px]" : ""}`}>
          <table className="w-full text-left border-collapse">
            <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Customer Info
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Activity (Billed)
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Activity (Paid)
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Global Dues
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {customers.length === 0 && (
              <tr className="block md:table-row">
                <td
                  colSpan="5"
                  className="block md:table-cell p-8 text-center text-gray-500 border-b"
                >
                  {filterArchived
                    ? "No archived customers found."
                    : "No matching customers found."}
                </td>
              </tr>
            )}

            {customers.map((c) => (
              <tr
                key={c.id}
                className="block md:table-row border-b border-gray-100 hover:bg-purple-50/10 transition-colors p-4 md:p-0"
              >
                <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-900 text-lg md:text-base">
                      {c.name}
                    </div>
                    {c.isArchived && (
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        ARCHIVED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.phone || "No Phone"} •{" "}
                    <span className="uppercase text-[#522874] font-semibold">
                      {c.type.replace("_", " ")}
                    </span>
                  </div>
                  {toDecimal(c.openingBalance || 0).gt(0) && (
                    <div className="text-[11px] mt-1 font-bold text-amber-700 bg-amber-50 border border-amber-100 inline-block px-2 py-0.5 rounded">
                      Previous Due:{" "}
                      {`₹${formatNumber(c.openingBalance || 0, 2)}`}
                    </div>
                  )}
                </td>

                <td className="block md:table-cell md:p-4 md:text-right mb-2 md:mb-0">
                  <div className="flex justify-between md:justify-end items-center">
                    <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                      Activity Billed:
                    </span>
                    <span className="font-bold text-gray-700">
                      {`₹${formatNumber(c.displayBilled, 2)}`}
                    </span>
                  </div>
                </td>

                <td className="block md:table-cell md:p-4 md:text-right mb-2 md:mb-0">
                  <div className="flex justify-between md:justify-end items-center">
                    <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                      Activity Paid:
                    </span>
                    <span className="font-bold text-green-600">
                      {`₹${formatNumber(c.displayPaid, 2)}`}
                    </span>
                  </div>
                </td>

                <td className="block md:table-cell md:p-4 md:text-right mb-4 md:mb-0">
                  <div className="flex justify-between md:justify-end items-center bg-red-50/50 p-2 md:p-0 rounded-lg">
                    <span className="md:hidden text-xs font-bold text-red-400 uppercase">
                      Global Dues:
                    </span>
                    <span
                      className={`font-black text-lg ${toDecimal(c.outstandingDues).gt(0) ? "text-red-600" : "text-gray-400"}`}
                    >
                      {`₹${formatNumber(c.outstandingDues, 2)}`}
                    </span>
                  </div>
                </td>

                <td className="block md:table-cell md:p-4 border-t md:border-none pt-4 md:pt-0">
                  <div className="flex flex-col sm:flex-row md:justify-end gap-2">
                    <button
                      onClick={() => {
                        let statementUrl = `/customers/${encodeURIComponent(c.name)}?shopId=${shopFilter}&date=${dateFilter}`;
                        if (dateFilter === "custom" && customStart && customEnd) {
                          statementUrl += `&start=${customStart}&end=${customEnd}`;
                        }
                        router.push(statementUrl);
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" /> Statement
                    </button>

                    {c.isArchived ? (
                      <button
                        onClick={() =>
                          setRestoreModal({
                            isOpen: true,
                            customer: c,
                            customerName: c.name,
                          })
                        }
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 cursor-pointer shadow-sm"
                      >
                        <RotateCcw className="w-4 h-4" /> Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setOpeningAmount(moneyToString(c.openingBalance || 0));
                            setOpeningModal({ isOpen: true, customer: c });
                          }}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 cursor-pointer"
                        >
                          <Landmark className="w-4 h-4" /> Set Previous Due
                        </button>

                        {toDecimal(c.outstandingDues).gt(0) ? (
                          <button
                            onClick={() => {
                              setPayAmount(moneyToString(c.outstandingDues));
                              setPaymentModal({ isOpen: true, customer: c });
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#522874] hover:bg-[#3d1d56] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 cursor-pointer"
                          >
                            <HandCoins className="w-4 h-4" /> Settle
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setArchiveModal({
                                isOpen: true,
                                customer: c,
                                customerName: c.name,
                              })
                            }
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 cursor-pointer"
                          >
                            <ArchiveX className="w-4 h-4" /> Archive
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {/* --- CUSTOM ARCHIVE CONFIRMATION MODAL --- */}
      {archiveModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6 mx-auto border border-gray-200">
              <ArchiveX className="w-8 h-8 text-gray-600" />
            </div>

            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Archive Customer?
            </h3>
            <p className="text-center text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to archive{" "}
              <strong className="text-gray-900">
                {archiveModal.customerName}
              </strong>
              ? <br />
              They will be hidden from this active ledger, but all their billing
              and payment history will be safely preserved in the database.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() =>
                  setArchiveModal({
                    isOpen: false,
                    customerId: null,
                    customerName: "",
                  })
                }
                disabled={isArchiving}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeArchive}
                disabled={isArchiving}
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-md disabled:opacity-70"
              >
                {isArchiving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArchiveX className="w-5 h-5" />
                )}
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM RESTORE CONFIRMATION MODAL --- */}
      {restoreModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-6 mx-auto border border-emerald-200">
              <RotateCcw className="w-8 h-8 text-emerald-600" />
            </div>

            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Restore Customer?
            </h3>
            <p className="text-center text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to restore{" "}
              <strong className="text-gray-900">
                {restoreModal.customerName}
              </strong>
              ? <br />
              They will be moved back to your active Khata ledger with all their past statements and account history intact.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() =>
                  setRestoreModal({
                    isOpen: false,
                    customer: null,
                    customerName: "",
                  })
                }
                disabled={isRestoring}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeRestore}
                disabled={isRestoring}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-md disabled:opacity-70"
              >
                {isRestoring ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {paymentModal.isOpen && paymentModal.customer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-600" /> Record
                Payment
              </h3>
              <button
                onClick={() =>
                  setPaymentModal({ isOpen: false, customer: null })
                }
                className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-5">
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex justify-between items-center">
                <span className="text-sm font-bold text-red-800">
                  {paymentModal.customer.name}
                </span>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-red-400">
                    Total Due
                  </span>
                  <span className="font-black text-red-600 text-lg">
                    {`₹${formatNumber(paymentModal.customer.outstandingDues, 2)}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Amount Received
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={moneyToString(paymentModal.customer.outstandingDues)}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Payment Mode
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium cursor-pointer"
                >
                  <option value="CASH">Cash 💵</option>
                  <option value="UPI">UPI 📱</option>
                  <option value="CARD">Credit/Debit Card 💳</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Remarks (Optional)
                </label>
                <input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Cleared via Cheque #1234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    setPaymentModal({ isOpen: false, customer: null })
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex justify-center items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Save Payment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREVIOUS DUE MODAL --- */}
      {openingModal.isOpen && openingModal.customer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-amber-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-700" /> Set Previous Due
              </h3>
              <button
                onClick={() =>
                  setOpeningModal({ isOpen: false, customer: null })
                }
                className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleOpeningBalance} className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <p className="text-sm font-bold text-amber-900">
                  {openingModal.customer.name}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Set carry-forward credit from old records before this app was
                  started.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Previous Due Amount (₹)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-gray-800"
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setOpeningModal({ isOpen: false, customer: null })
                  }
                  disabled={isOpeningSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOpeningSubmitting}
                  className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors flex justify-center items-center gap-2 shadow-md disabled:opacity-70"
                >
                  {isOpeningSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Landmark className="w-5 h-5" />
                  )}
                  Save Due
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

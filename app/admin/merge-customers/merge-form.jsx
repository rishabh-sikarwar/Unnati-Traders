"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle,
} from "lucide-react";
import { formatNumber } from "@/lib/format";

export default function MergeForm({ customers }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Primary customer state (the profile to keep)
  const [primaryQuery, setPrimaryQuery] = useState("");
  const [primarySelected, setPrimarySelected] = useState(null);
  const [primaryOpen, setPrimaryOpen] = useState(false);

  // Duplicate customer state (the profile to delete)
  const [duplicateQuery, setDuplicateQuery] = useState("");
  const [duplicateSelected, setDuplicateSelected] = useState(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  // Modals / Double Confirmations
  const [confirmOpen, setConfirmOpen] = useState(false);

  const primaryRef = useRef(null);
  const duplicateRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (primaryRef.current && !primaryRef.current.contains(e.target)) {
        setPrimaryOpen(false);
      }
      if (duplicateRef.current && !duplicateRef.current.contains(e.target)) {
        setDuplicateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter lists while preventing selecting the same customer in both dropdowns
  const filteredPrimary = useMemo(() => {
    return customers
      .filter((c) => c.id !== duplicateSelected?.id)
      .filter(
        (c) =>
          c.name.toLowerCase().includes(primaryQuery.toLowerCase()) ||
          (c.phone && c.phone.includes(primaryQuery))
      );
  }, [customers, primaryQuery, duplicateSelected]);

  const filteredDuplicate = useMemo(() => {
    return customers
      .filter((c) => c.id !== primarySelected?.id)
      .filter(
        (c) =>
          c.name.toLowerCase().includes(duplicateQuery.toLowerCase()) ||
          (c.phone && c.phone.includes(duplicateQuery))
      );
  }, [customers, duplicateQuery, primarySelected]);

  const handleMerge = async () => {
    if (!primarySelected || !duplicateSelected) {
      return toast.error("Please select both primary and duplicate customers.");
    }

    setLoading(true);
    setConfirmOpen(false);
    const toastId = toast.loading("Merging accounts & consolidating logs...");

    try {
      const res = await fetch("/api/customers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryCustomerId: primarySelected.id,
          duplicateCustomerId: duplicateSelected.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Merge failed");

      toast.success(data.message || "Customer profiles merged successfully!", {
        id: toastId,
        duration: 5000,
      });

      // Reset states
      setPrimarySelected(null);
      setPrimaryQuery("");
      setDuplicateSelected(null);
      setDuplicateQuery("");

      router.refresh();
      // Redirect back to admin dashboard after short delay
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        
        {/* Column 1: Duplicate Profile (To Merge & Delete) */}
        <div className="bg-rose-50/5 p-5 rounded-2xl border border-rose-200 shadow-md relative space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
              1
            </span>
            <h2 className="font-bold text-gray-800 text-base">
              Duplicate Profile (To Merge & Delete)
            </h2>
          </div>

          <div className="relative" ref={duplicateRef}>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Search Customer Name / Phone
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={duplicateSelected ? duplicateSelected.name : duplicateQuery}
                onFocus={() => {
                  setDuplicateOpen(true);
                  if (duplicateSelected) {
                    setDuplicateSelected(null);
                    setDuplicateQuery("");
                  }
                }}
                onChange={(e) => {
                  setDuplicateQuery(e.target.value);
                  setDuplicateSelected(null);
                  setDuplicateOpen(true);
                }}
                className={`w-full pl-9 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-rose-400 transition-all font-medium ${
                  duplicateSelected
                    ? "bg-rose-50/60 border-rose-300 font-bold text-rose-900"
                    : "border-gray-300 text-gray-700"
                }`}
                placeholder="Type customer name..."
              />
            </div>

            {duplicateOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                {filteredDuplicate.length > 0 ? (
                  filteredDuplicate.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setDuplicateSelected(c);
                        setDuplicateOpen(false);
                      }}
                      className="px-4 py-2.5 hover:bg-rose-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{c.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {c.phone} • <span className="uppercase font-semibold text-[#522874]">{c.type.replace("_", " ")}</span>
                        </div>
                      </div>
                      <Building className="w-4 h-4 text-gray-400" />
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 italic">
                    No duplicate customers found matching "{duplicateQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Duplicate Selection Summary Card */}
          {duplicateSelected ? (
            <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-4 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start">
                <span className="text-xs text-rose-700 font-black tracking-wider uppercase bg-rose-100/60 px-2.5 py-0.5 rounded-full">
                  Will Be Deleted
                </span>
                <span className="text-xs text-gray-400 font-medium">ID: {duplicateSelected.id.slice(0, 8)}...</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-black text-gray-900">{duplicateSelected.name}</p>
                <p className="text-gray-500 text-xs">Phone: {duplicateSelected.phone}</p>
                {duplicateSelected.gstNumber && <p className="text-gray-500 text-xs uppercase font-semibold">GSTIN: {duplicateSelected.gstNumber}</p>}
                {duplicateSelected.address && <p className="text-gray-500 text-xs truncate">Address: {duplicateSelected.address}</p>}
              </div>
              <div className="pt-2 border-t border-rose-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-bold uppercase">Opening Balance:</span>
                <span className="font-bold text-rose-900 text-sm">₹{formatNumber(duplicateSelected.openingBalance, 2)}</span>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs font-semibold">
              Select customer profile that you want to delete.
            </div>
          )}
        </div>

        {/* Directional Arrow Middle Column */}
        <div className="flex justify-center py-2 lg:py-0">
          <div className="bg-purple-100 text-purple-700 p-3 rounded-full shadow-sm transition-transform duration-300 hover:scale-110">
            <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
          </div>
        </div>

        {/* Column 3: Target Profile (Account to Keep) */}
        <div className="bg-emerald-50/5 p-5 rounded-2xl border border-emerald-200 shadow-md relative space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
              2
            </span>
            <h2 className="font-bold text-gray-800 text-base">
              Target Profile (Account to Keep)
            </h2>
          </div>

          <div className="relative" ref={primaryRef}>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Search Customer Name / Phone
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={primarySelected ? primarySelected.name : primaryQuery}
                onFocus={() => {
                  setPrimaryOpen(true);
                  if (primarySelected) {
                    setPrimarySelected(null);
                    setPrimaryQuery("");
                  }
                }}
                onChange={(e) => {
                  setPrimaryQuery(e.target.value);
                  setPrimarySelected(null);
                  setPrimaryOpen(true);
                }}
                className={`w-full pl-9 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium ${
                  primarySelected
                    ? "bg-emerald-50/60 border-emerald-300 font-bold text-emerald-900"
                    : "border-gray-300 text-gray-700"
                }`}
                placeholder="Type customer name..."
              />
            </div>

            {primaryOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                {filteredPrimary.length > 0 ? (
                  filteredPrimary.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setPrimarySelected(c);
                        setPrimaryOpen(false);
                      }}
                      className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{c.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {c.phone} • <span className="uppercase font-semibold text-[#522874]">{c.type.replace("_", " ")}</span>
                        </div>
                      </div>
                      <Building className="w-4 h-4 text-gray-400" />
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 italic">
                    No customers found matching "{primaryQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Primary Selection Summary Card */}
          {primarySelected ? (
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start">
                <span className="text-xs text-emerald-700 font-black tracking-wider uppercase bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                  Keep Active
                </span>
                <span className="text-xs text-gray-400 font-medium">ID: {primarySelected.id.slice(0, 8)}...</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-black text-gray-900">{primarySelected.name}</p>
                <p className="text-gray-500 text-xs">Phone: {primarySelected.phone}</p>
                {primarySelected.gstNumber && <p className="text-gray-500 text-xs uppercase font-semibold">GSTIN: {primarySelected.gstNumber}</p>}
                {primarySelected.address && <p className="text-gray-500 text-xs truncate">Address: {primarySelected.address}</p>}
              </div>
              <div className="pt-2 border-t border-emerald-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-bold uppercase">Opening Balance:</span>
                <span className="font-bold text-emerald-900 text-sm">₹{formatNumber(primarySelected.openingBalance, 2)}</span>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs font-semibold">
              Select customer profile that you want to keep.
            </div>
          )}
        </div>

      </div>

      {/* Warning Box & Action Panel */}
      {primarySelected && duplicateSelected ? (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-amber-900 text-base">Warning: Irreversible Account Consolidation</h4>
              <p className="text-sm text-amber-800 font-medium leading-relaxed">
                You are about to merge the customer <strong className="text-gray-900 font-black">"{duplicateSelected.name}"</strong> into <strong className="text-gray-900 font-black">"{primarySelected.name}"</strong>.
              </p>
              <ul className="text-xs text-amber-700 font-semibold space-y-1 mt-3 list-disc list-inside">
                <li>Duplicate account will be permanently deleted from database.</li>
                <li>Opening balances will be summed: <span className="font-extrabold">₹{formatNumber(primarySelected.openingBalance, 2)} + ₹{formatNumber(duplicateSelected.openingBalance, 2)} = ₹{formatNumber(primarySelected.openingBalance + duplicateSelected.openingBalance, 2)}</span>.</li>
                <li>All transaction registers (invoices, receipts, payments, ledger logs) will re-link to the target profile.</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200 flex justify-end">
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-base rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              Merge Accounts <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Dynamic Overlay Confirmation Modal */}
      {confirmOpen && primarySelected && duplicateSelected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-5 mx-auto border border-amber-200">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>

            <h3 className="text-xl font-bold text-center text-gray-900 mb-3">
              Confirm Customer Merge
            </h3>
            
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase border-b border-gray-200 pb-2">
                <span>Account Flow</span>
                <span>Customer Profile</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-xs">DELETE</span>
                <span className="font-bold text-gray-900 truncate max-w-[240px]">{duplicateSelected.name}</span>
              </div>
              <div className="flex justify-center py-1">
                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90 sm:rotate-0" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded text-xs">KEEP ACTIVE</span>
                <span className="font-bold text-gray-900 truncate max-w-[240px]">{primarySelected.name}</span>
              </div>
            </div>

            <p className="text-center text-gray-500 text-xs mb-8 leading-relaxed font-semibold">
              This action cannot be undone. Are you absolutely certain you want to merge these accounts?
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleMerge}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Yes, Merge Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

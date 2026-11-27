"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Loader2,
  Info,
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  Receipt,
  Sparkles,
  Building2,
  Package,
} from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector";
import TransferChallanModal from "@/components/admin/transfer-challan-modal";
import { formatNumber } from "@/lib/format";

export default function TransferStockForm({
  products = [],
  locations = [],
  userRole = "ADMIN",
  userLocationId = "",
}) {
  const router = useRouter();

  // Top Shared Challan State
  const initialFrom =
    userRole === "SHOPKEEPER" && userLocationId
      ? userLocationId
      : locations[0]?.id || "";

  const [fromLocation, setFromLocation] = useState(initialFrom);
  const [toLocation, setToLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdTransfer, setCreatedTransfer] = useState(null);

  // Multi-Item Rows State
  const [items, setItems] = useState([
    {
      id: "row-1",
      productId: "",
      quantity: "",
      unitPrice: "",
    },
  ]);

  // Destination locations excluding currently selected source shop
  const destinationOptions = useMemo(() => {
    return locations.filter((loc) => loc.id !== fromLocation);
  }, [locations, fromLocation]);

  // Handle source location change
  const handleFromLocationChange = (newFrom) => {
    setFromLocation(newFrom);
    if (toLocation === newFrom) {
      setToLocation("");
    }
  };

  // Helper to get available stock in source shop for a product
  const getSourceStock = (productId) => {
    if (!productId || !fromLocation) return 0;
    const prod = products.find((p) => p.id === productId);
    const inv = prod?.inventories?.find((i) => i.locationId === fromLocation);
    return inv ? inv.quantity : 0;
  };

  // Handle selecting a tyre in a specific row
  const handleProductSelect = (rowId, productId) => {
    const prod = products.find((p) => p.id === productId);
    const defaultRate =
      prod?.lastPurchaseRate !== undefined && prod?.lastPurchaseRate !== null
        ? prod.lastPurchaseRate
        : Number(prod?.basePrice || 0);

    setItems((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productId,
              unitPrice: defaultRate.toString(),
            }
          : row
      )
    );
  };

  // Handle row quantity change
  const handleQuantityChange = (rowId, val) => {
    setItems((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, quantity: val } : row))
    );
  };

  // Handle row unit rate change
  const handleRateChange = (rowId, val) => {
    setItems((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, unitPrice: val } : row))
    );
  };

  // Add another item row
  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: "",
        quantity: "",
        unitPrice: "",
      },
    ]);
  };

  // Remove an item row
  const handleRemoveRow = (rowId) => {
    if (items.length <= 1) {
      // Clear single row instead of removing
      setItems([
        {
          id: `row-${Date.now()}`,
          productId: "",
          quantity: "",
          unitPrice: "",
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Summary Metrics
  const totalTyresMoving = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [items]);

  const totalChallanWorth = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = Number(it.quantity) || 0;
      const r = Number(it.unitPrice) || 0;
      return sum + q * r;
    }, 0);
  }, [items]);

  // Validation Check
  const hasInvalidRows = useMemo(() => {
    if (!fromLocation || !toLocation) return true;
    if (items.length === 0) return true;

    for (const it of items) {
      if (!it.productId) return true;
      const q = Number(it.quantity);
      if (isNaN(q) || q <= 0) return true;
      const avail = getSourceStock(it.productId);
      if (q > avail) return true;
      const r = Number(it.unitPrice);
      if (isNaN(r) || r < 0) return true;
    }
    return false;
  }, [items, fromLocation, toLocation, products]);

  // Submit Multi-Item Transfer
  async function handleTransferSubmit(e) {
    e.preventDefault();

    if (!fromLocation) {
      return toast.error("Please select a Source Shop");
    }
    if (!toLocation) {
      return toast.error("Please select a Destination Shop");
    }
    if (fromLocation === toLocation) {
      return toast.error("Source and destination shop cannot be the same");
    }

    if (items.length === 0) {
      return toast.error("Please add at least one tyre to transfer");
    }

    // Validate rows
    const cleanedItems = [];
    const seenProductIds = new Set();

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) {
        return toast.error(`Row #${i + 1}: Please select a tyre model`);
      }
      if (seenProductIds.has(it.productId)) {
        const prod = products.find((p) => p.id === it.productId);
        return toast.error(
          `Duplicate tyre "${prod?.modelName || "Item"}" selected. Please combine quantities into one row.`
        );
      }
      seenProductIds.add(it.productId);

      const qty = Number(it.quantity);
      if (!qty || qty <= 0) {
        return toast.error(`Row #${i + 1}: Please enter a valid quantity to move`);
      }

      const available = getSourceStock(it.productId);
      if (qty > available) {
        const prod = products.find((p) => p.id === it.productId);
        return toast.error(
          `Row #${i + 1} (${prod?.modelName}): Quantity (${qty}) exceeds available stock (${available})`
        );
      }

      const rate = Number(it.unitPrice);
      if (isNaN(rate) || rate < 0) {
        return toast.error(`Row #${i + 1}: Transfer rate cannot be negative`);
      }

      cleanedItems.push({
        productId: it.productId,
        quantity: qty,
        unitPrice: rate,
      });
    }

    setLoading(true);
    const loadingToast = toast.loading(
      `Dispatching batch transfer of ${totalTyresMoving} tyres...`
    );

    try {
      const res = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLocation,
          toLocation,
          notes: notes.trim(),
          items: cleanedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch transfer failed");

      toast.success(
        `Challan ${data.transfer?.transferNumber || ""} created with ${totalTyresMoving} tyres! 🎉`,
        { id: loadingToast }
      );

      // Open Challan Modal
      if (data.transfer) {
        setCreatedTransfer(data.transfer);
      }

      // Reset items and notes
      setItems([
        {
          id: `row-${Date.now()}`,
          productId: "",
          quantity: "",
          unitPrice: "",
        },
      ]);
      setNotes("");

      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {createdTransfer && (
        <TransferChallanModal
          transfer={createdTransfer}
          onClose={() => setCreatedTransfer(null)}
        />
      )}

      <form
        onSubmit={handleTransferSubmit}
        className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-gray-200 space-y-6"
      >
        {/* --- TOP HEADER ROW (SHARED FOR CHALLAN) --- */}
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#522874]">
            <Building2 className="w-4 h-4" />
            <span>Challan Route & Dispatch Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SOURCE SHOP (FROM) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-gray-700 uppercase">
                  Source Shop (Dispatched From)
                </label>
                {userRole === "SHOPKEEPER" && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Assigned Shop
                  </span>
                )}
              </div>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none transition-all cursor-pointer bg-white text-sm font-bold text-gray-900 shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={fromLocation}
                disabled={userRole === "SHOPKEEPER"}
                onChange={(e) => handleFromLocationChange(e.target.value)}
              >
                <option value="">-- Select Source Branch --</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DESTINATION SHOP (TO) */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">
                Destination Shop (Delivered To)
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 outline-none transition-all cursor-pointer bg-white text-sm font-bold text-gray-900 shadow-sm"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
              >
                <option value="">-- Select Destination Branch --</option>
                {destinationOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              {destinationOptions.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">
                  Add another shop in Settings to enable transfers.
                </p>
              )}
            </div>
          </div>

          {/* REMARKS / DRIVER / VEHICLE DETAILS */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase mb-1.5">
              Remarks / Vehicle / Driver Details (Single for Challan)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched via Tempo DL-1AA-1234, Driver: Rajesh Kumar (Ph: 9876543210)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none transition-all text-sm font-medium text-gray-800 shadow-sm bg-white"
            />
          </div>
        </div>

        {/* --- MULTI-ITEM BATCH ROWS --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#522874]" />
              <h3 className="text-base font-black text-gray-900">
                Transfer Items ({items.length})
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-semibold">
              Select tyres to dispatch in this batch
            </span>
          </div>

          {/* Item Rows */}
          <div className="space-y-3">
            {items.map((row, index) => {
              const prod = products.find((p) => p.id === row.productId);
              const availStock = getSourceStock(row.productId);
              const qtyNum = Number(row.quantity) || 0;
              const rateNum = Number(row.unitPrice) || 0;
              const rowWorth = qtyNum * rateNum;
              const isOverStock = row.productId && qtyNum > availStock;
              const isTTF = Boolean(prod?.hasTube || prod?.hasFlap);

              return (
                <div
                  key={row.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverStock
                      ? "border-red-300 bg-red-50/30"
                      : "border-gray-200 bg-white hover:border-gray-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-[#522874] font-black text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        Tyre #{index + 1}
                      </span>
                      {row.productId && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            availStock > 0
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {availStock > 0
                            ? `Available: ${availStock}`
                            : "Out of Stock (0)"}
                        </span>
                      )}
                      {isTTF && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          TTF Set
                        </span>
                      )}
                    </div>

                    {/* Trash Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title={
                        items.length > 1
                          ? "Remove this tyre row"
                          : "Clear this row"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* TYRE SELECTOR (6 cols) */}
                    <div className="md:col-span-5">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                        Select Tyre Model
                      </label>
                      <SmartTyreSelector
                        products={products}
                        selectedProductId={row.productId}
                        onSelect={(id) => handleProductSelect(row.id, id)}
                        sourceLocationId={fromLocation}
                      />
                    </div>

                    {/* QTY TO MOVE (2 cols) */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                        Qty to Move
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={availStock > 0 ? availStock : undefined}
                        placeholder="Qty"
                        value={row.quantity}
                        onChange={(e) =>
                          handleQuantityChange(row.id, e.target.value)
                        }
                        disabled={!row.productId || availStock === 0}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm font-black outline-none transition-all shadow-sm ${
                          isOverStock
                            ? "border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500"
                            : "border-gray-300 focus:ring-2 focus:ring-[#522874] text-gray-900 bg-white"
                        }`}
                      />
                    </div>

                    {/* TRANSFER RATE (3 cols) */}
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase truncate">
                          Transfer Rate (₹ / Unit)
                        </label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Rate"
                          value={row.unitPrice}
                          onChange={(e) =>
                            handleRateChange(row.id, e.target.value)
                          }
                          disabled={!row.productId}
                          className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#522874] bg-white shadow-sm"
                        />
                      </div>
                    </div>

                    {/* ROW WORTH (2 cols) */}
                    <div className="md:col-span-2 pt-1 md:pt-0">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                        Row Worth
                      </label>
                      <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-900 truncate">
                        ₹{formatNumber(rowWorth, 2)}
                      </div>
                    </div>
                  </div>

                  {/* Overstock Warning */}
                  {isOverStock && (
                    <div className="mt-2 text-xs text-red-600 font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Requested {qtyNum} tyres, but only {availStock} are
                        available at the source branch!
                      </span>
                    </div>
                  )}

                  {/* TTF Set Breakdown */}
                  {isTTF && prod && (
                    <div className="mt-2 text-[11px] text-purple-900 bg-purple-50/60 p-2 rounded-lg flex flex-wrap items-center gap-2 border border-purple-100">
                      <span className="font-bold">Set Breakdown:</span>
                      {prod.hasTube && (
                        <span>
                          Tube: {prod.tubeName || "Apollo Tube"} (₹
                          {prod.tubePrice})
                        </span>
                      )}
                      {prod.hasFlap && (
                        <span>
                          Flap: {prod.flapName || "Flap"} (₹{prod.flapPrice})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* + ADD ANOTHER TYRE BUTTON */}
          <button
            type="button"
            onClick={handleAddRow}
            className="w-full py-3 px-4 border-2 border-dashed border-purple-200 hover:border-[#522874] hover:bg-purple-50/50 rounded-2xl text-sm font-bold text-[#522874] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Another Tyre to this Challan</span>
          </button>
        </div>

        {/* --- LIVE BOTTOM SUMMARY BAR --- */}
        <div className="bg-gradient-to-r from-purple-50 via-purple-100/40 to-indigo-50 border border-purple-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                Total Tyres Moving
              </div>
              <div className="text-2xl font-black text-gray-900">
                {totalTyresMoving}{" "}
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Units
                </span>
              </div>
            </div>

            <div className="border-l border-purple-200 pl-6">
              <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                Total Challan Worth
              </div>
              <div className="text-2xl font-black text-[#522874]">
                ₹{formatNumber(totalChallanWorth, 2)}
              </div>
            </div>
          </div>

          {/* EXECUTE BUTTON */}
          <button
            type="submit"
            disabled={loading || hasInvalidRows || totalTyresMoving <= 0}
            className="w-full md:w-auto px-7 py-3.5 bg-[#522874] hover:bg-[#3d1d56] text-white rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm sm:text-base shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Challan...</span>
              </>
            ) : (
              <>
                <Truck className="w-5 h-5" />
                <span>Execute Transfer & Generate Challan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}

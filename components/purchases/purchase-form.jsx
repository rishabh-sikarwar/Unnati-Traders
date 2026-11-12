"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Plus,
  Trash2,
  Loader2,
  PackageOpen,
  Truck,
  Save,
  X,
} from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector";
import { formatNumber } from "@/lib/format";
import { toDecimal, moneyToString } from "@/lib/money";

export default function PurchaseForm({
  products,
  locations,
  userId,
  userRole,
  userLocationId,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const getTodayValue = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const handleFocus = () => router.refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(getTodayValue());
  const [supplierName, setSupplierName] = useState("Apollo Tyres");
  const [locationId, setLocationId] = useState(
    userRole === "SHOPKEEPER" ? userLocationId : "",
  );

  const [cart, setCart] = useState([]);

  const addItem = () =>
    setCart([
      {
        rowId: Math.random().toString(36).substr(2, 9),
        productId: "",
        quantity: 1,
        unitCost: "",
        includeTube: false,
        tubeName: "",
        tubePrice: "",
        includeFlap: false,
        flapName: "",
        flapPrice: "",
      },
      ...cart,
    ]);

  const removeItem = (id) => setCart(cart.filter((item) => item.rowId !== id));

  const updateItem = (id, field, value) => {
    const newCart = cart.map((item) =>
      item.rowId === id ? { ...item, [field]: value } : item,
    );
    setCart(newCart);
  };

  // --- Auto-Populate Price & TTF Set Logic ---
  const handleProductSelect = (rowId, productId) => {
    const selectedProduct = products.find((p) => p.id === productId);
    const newCart = cart.map((item) => {
      if (item.rowId === rowId) {
        return {
          ...item,
          productId: productId,
          unitCost: selectedProduct ? selectedProduct.basePrice : item.unitCost, // Auto-fill price!
          // Auto-populate TTF Set components if product has hasTube / hasFlap
          includeTube: Boolean(selectedProduct?.hasTube),
          tubeName: selectedProduct?.hasTube ? selectedProduct.tubeName || "" : "",
          tubePrice: selectedProduct?.hasTube ? Number(selectedProduct.tubePrice || 0) : "",
          includeFlap: Boolean(selectedProduct?.hasFlap),
          flapName: selectedProduct?.hasFlap ? selectedProduct.flapName || "" : "",
          flapPrice: selectedProduct?.hasFlap ? Number(selectedProduct.flapPrice || 0) : "",
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const exactTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const tyreCost = toDecimal(item.unitCost || 0);
      const tubeCost = item.includeTube ? toDecimal(item.tubePrice || 0) : toDecimal(0);
      const flapCost = item.includeFlap ? toDecimal(item.flapPrice || 0) : toDecimal(0);
      const unitSetCost = tyreCost.plus(tubeCost).plus(flapCost);
      const lineTotal = toDecimal(item.quantity || 0).times(unitSetCost);
      return total.plus(lineTotal);
    }, toDecimal(0));
  }, [cart]);

  const roundedTotal = useMemo(() => exactTotal.ceil(), [exactTotal]);
  const roundOffAmount = useMemo(() => roundedTotal.minus(exactTotal), [roundedTotal, exactTotal]);

  const selectedProductIds = useMemo(
    () => cart.map((item) => item.productId).filter(Boolean),
    [cart],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceNumber || !locationId || cart.length === 0) {
      return toast.error("Please fill required fields and add items.");
    }

    if (!purchaseDate) {
      return toast.error("Please select the purchase date.");
    }

    const formattedItems = cart.map((item, index) => {
      if (!item.productId)
        throw new Error(`Please select a tyre for item #${index + 1}`);
      const selectedProd = products.find((p) => p.id === item.productId);
      const qty = Number(item.quantity);
      if (qty <= 0)
        throw new Error(`Quantity for item #${index + 1} must be at least 1.`);
      if (!item.unitCost || Number(item.unitCost) <= 0)
        throw new Error(`Please enter a valid buying cost for item #${index + 1}.`);

      const tyreCost = toDecimal(item.unitCost || 0);
      const tubeCost = item.includeTube ? toDecimal(item.tubePrice || 0) : toDecimal(0);
      const flapCost = item.includeFlap ? toDecimal(item.flapPrice || 0) : toDecimal(0);
      const unitSetCost = tyreCost.plus(tubeCost).plus(flapCost);
      const lineTotal = toDecimal(qty).times(unitSetCost);

      return {
        productId: item.productId,
        quantity: qty,
        unitCost: moneyToString(item.unitCost),
        totalCost: moneyToString(lineTotal),
        includeTube: Boolean(item.includeTube),
        tubeName: item.includeTube ? (item.tubeName || `${selectedProd?.modelName || "Tyre"} Tube`) : null,
        tubePrice: item.includeTube && item.tubePrice ? moneyToString(item.tubePrice) : 0,
        includeFlap: Boolean(item.includeFlap),
        flapName: item.includeFlap ? (item.flapName || `${selectedProd?.modelName || "Tyre"} Flap`) : null,
        flapPrice: item.includeFlap && item.flapPrice ? moneyToString(item.flapPrice) : 0,
      };
    });

    setLoading(true);
    const loadingToast = toast.loading("Recording Purchase...");

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          supplierName,
          locationId,
          purchaseDate,
          userId,
          items: formattedItems,
          totalAmount: roundedTotal,
        }),
      });

      if (!res.ok) throw new Error("Failed to inward stock");

      toast.success("Stock Inwarded Successfully!", { id: loadingToast });
      router.push("/dashboard");
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-5">
            <Truck className="w-5 h-5 text-[#522874]" /> Purchase Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Invoice Number
              </label>
              <input
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter Apollo invoice number"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-[#522874]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Purchase Date
              </label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  required
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Destination Shop (Unload Here)
              </label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={userRole === "SHOPKEEPER"}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none ${
                  userRole === "SHOPKEEPER"
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "focus:ring-2 focus:ring-[#522874] bg-white"
                }`}
              >
                <option value="">-- Select Shop/Warehouse --</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Supplier Name
              </label>
              <input
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-[#522874]" /> Received
              Materials
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm bg-purple-50 text-[#522874] px-3 py-2 rounded-md font-bold hover:bg-purple-100 flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {cart.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium bg-gray-50">
                Click{" "}
                <span className="text-[#522874] font-bold">"Add Item"</span> to
                record incoming stock.
              </div>
            )}

            {cart.map((item) => {
              const selectedProduct = products.find((p) => p.id === item.productId);
              const tyreCost = toDecimal(item.unitCost || 0);
              const tubeCost = item.includeTube ? toDecimal(item.tubePrice || 0) : toDecimal(0);
              const flapCost = item.includeFlap ? toDecimal(item.flapPrice || 0) : toDecimal(0);
              const unitSetCost = tyreCost.plus(tubeCost).plus(flapCost);
              const lineTotal = toDecimal(item.quantity || 0).times(unitSetCost);
              const hasTTF = Boolean(item.includeTube || item.includeFlap);

              const availableProducts = products.filter(
                (p) =>
                  !selectedProductIds.includes(p.id) || p.id === item.productId,
              );

              return (
                <div
                  key={item.rowId}
                  className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm relative animate-in fade-in slide-in-from-top-4 duration-300"
                >
                  <div className="w-full relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Select Tyre from Master Catalogue
                    </label>
                    <SmartTyreSelector
                      products={availableProducts}
                      selectedProductId={item.productId}
                      onSelect={(val) => handleProductSelect(item.rowId, val)}
                    />
                  </div>

                  {/* ROW 1: MAIN TYRE QUANTITY & BUYING RATE */}
                  <div className="flex flex-wrap sm:flex-nowrap items-end gap-3">
                    <div className="flex-1 sm:flex-none sm:w-24">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Inward Qty
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseInt(val, 10);
                          updateItem(item.rowId, "quantity", isNaN(parsed) ? "" : parsed);
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none h-[42px]"
                      />
                    </div>
                    <div className="flex-1 sm:flex-none sm:w-36">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 truncate">
                        {hasTTF ? "Tyre Cost (₹)" : "Buying Cost (₹)"}
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          updateItem(item.rowId, "unitCost", e.target.value)
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none h-[42px] font-bold text-gray-800"
                        placeholder="₹0.00"
                      />
                    </div>
                    <div className="w-full sm:w-auto sm:flex-1 bg-white border border-gray-200 px-4 py-2 rounded-lg text-right h-[42px] flex flex-col justify-center shadow-inner">
                      <div className="font-black text-gray-800 leading-tight">
                        {`₹${formatNumber(lineTotal, 2)}`}
                      </div>
                      {hasTTF && (
                        <div className="text-[10px] text-gray-500 font-mono">
                          Set: ₹{formatNumber(unitSetCost, 2)}/ea
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.rowId)}
                      className="h-[42px] w-[42px] shrink-0 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 bg-white border border-gray-200 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                      title="Remove tyre row"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* ROW 2: TUBE SUB-ROW (IF ACTIVE) */}
                  {item.includeTube && (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 animate-in fade-in duration-200">
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                        <div className="flex-1 min-w-[180px]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              TUBE
                            </span>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">
                              Tube Description
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Tube description (e.g. 10.00R20 APOLLO TUBE)"
                            value={item.tubeName || ""}
                            onChange={(e) => updateItem(item.rowId, "tubeName", e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                          />
                        </div>

                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 truncate">
                            Qty (Synced)
                          </label>
                          <div className="h-[38px] px-3 bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-center cursor-not-allowed select-none">
                            {item.quantity || 1}
                          </div>
                        </div>

                        <div className="w-28 sm:w-36 shrink-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 truncate">
                            Tube Cost (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="₹0.00"
                            value={item.tubePrice}
                            onChange={(e) => updateItem(item.rowId, "tubePrice", e.target.value)}
                            className="w-full h-[38px] px-3 text-xs font-bold text-gray-800 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div className="w-24 text-right hidden sm:block shrink-0">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 truncate">
                            Tube Total
                          </label>
                          <div className="text-xs font-bold text-blue-900 h-[38px] flex items-center justify-end">
                            {`₹${formatNumber(toDecimal(item.quantity || 0).times(toDecimal(item.tubePrice || 0)), 2)}`}
                          </div>
                        </div>

                        <div className="shrink-0 pt-4 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => updateItem(item.rowId, "includeTube", false)}
                            className="h-[38px] px-2.5 text-xs text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-red-200 hover:border-red-500 transition-colors font-bold flex items-center gap-1 cursor-pointer"
                            title="Remove tube"
                          >
                            <X className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ROW 3: FLAP SUB-ROW (IF ACTIVE) */}
                  {item.includeFlap && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 animate-in fade-in duration-200">
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                        <div className="flex-1 min-w-[180px]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              FLAP
                            </span>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">
                              Flap Description
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Flap description (e.g. 20 INCH RADIAL FLAP)"
                            value={item.flapName || ""}
                            onChange={(e) => updateItem(item.rowId, "flapName", e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-medium text-gray-800"
                          />
                        </div>

                        <div className="w-20 sm:w-24 shrink-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 truncate">
                            Qty (Synced)
                          </label>
                          <div className="h-[38px] px-3 bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-center cursor-not-allowed select-none">
                            {item.quantity || 1}
                          </div>
                        </div>

                        <div className="w-28 sm:w-36 shrink-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 truncate">
                            Flap Cost (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="₹0.00"
                            value={item.flapPrice}
                            onChange={(e) => updateItem(item.rowId, "flapPrice", e.target.value)}
                            className="w-full h-[38px] px-3 text-xs font-bold text-gray-800 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>

                        <div className="w-24 text-right hidden sm:block shrink-0">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 truncate">
                            Flap Total
                          </label>
                          <div className="text-xs font-bold text-amber-900 h-[38px] flex items-center justify-end">
                            {`₹${formatNumber(toDecimal(item.quantity || 0).times(toDecimal(item.flapPrice || 0)), 2)}`}
                          </div>
                        </div>

                        <div className="shrink-0 pt-4 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => updateItem(item.rowId, "includeFlap", false)}
                            className="h-[38px] px-2.5 text-xs text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-red-200 hover:border-red-500 transition-colors font-bold flex items-center gap-1 cursor-pointer"
                            title="Remove flap"
                          >
                            <X className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QUICK + TUBE / + FLAP BUTTONS IF NOT INCLUDED */}
                  {(!item.includeTube || !item.includeFlap) && (
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Inward Set:
                      </span>
                      {!item.includeTube && (
                        <button
                          type="button"
                          onClick={() => {
                            const defaultName = selectedProduct?.tubeName || `${selectedProduct?.size || ""} APOLLO TUBE`.trim();
                            const defaultPrice = selectedProduct?.tubePrice ? Number(selectedProduct.tubePrice) : "";
                            const newCart = cart.map((c) =>
                              c.rowId === item.rowId
                                ? {
                                    ...c,
                                    includeTube: true,
                                    tubeName: c.tubeName || defaultName,
                                    tubePrice: c.tubePrice !== "" ? c.tubePrice : defaultPrice,
                                  }
                                : c
                            );
                            setCart(newCart);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Tube
                        </button>
                      )}
                      {!item.includeFlap && (
                        <button
                          type="button"
                          onClick={() => {
                            const defaultName = selectedProduct?.flapName || `${selectedProduct?.size || ""} RADIAL FLAP`.trim();
                            const defaultPrice = selectedProduct?.flapPrice ? Number(selectedProduct.flapPrice) : "";
                            const newCart = cart.map((c) =>
                              c.rowId === item.rowId
                                ? {
                                    ...c,
                                    includeFlap: true,
                                    flapName: c.flapName || defaultName,
                                    flapPrice: c.flapPrice !== "" ? c.flapPrice : defaultPrice,
                                  }
                                : c
                            );
                            setCart(newCart);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Flap
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Summary */}
      <div className="space-y-6">
        <div className="bg-[#3d1d56] text-white p-6 md:p-8 rounded-xl shadow-lg lg:sticky lg:top-28">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <Save className="w-5 h-5 text-purple-300" /> Inward Summary
          </h2>
          <div className="border-t border-white/20 pt-2 mb-6">
            {roundOffAmount.gt(0) && (
              <div className="flex justify-between items-center text-xs text-white/60 pt-2 pb-2 border-b border-white/10">
                <span>Round Off</span>
                <span>+₹{roundOffAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex flex-col items-end gap-1 mt-4">
              <span className="text-sm font-bold text-white/80 uppercase">
                Total Purchase Value
              </span>
              <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md">
                {`₹${formatNumber(roundedTotal, 2)}`}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 active:scale-95 flex justify-center items-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
            {loading ? "Processing..." : "Record Purchase & Inward Stock"}
          </button>
        </div>
      </div>
    </form>
  );
}

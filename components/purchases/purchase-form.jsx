"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Trash2, Loader2, PackageOpen, Truck, Save } from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector";

export default function PurchaseForm({ products, locations, userId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleFocus = () => router.refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("Apollo Tyres");
  const [locationId, setLocationId] = useState("");

  useEffect(() => {
    setInvoiceNumber(`INV-IN-${Date.now().toString().slice(-6)}`);
  }, []);

  const [cart, setCart] = useState([]);

  const addItem = () =>
    setCart([
      {
        rowId: Math.random().toString(36).substr(2, 9),
        productId: "",
        quantity: 1,
        unitCost: "",
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

  // --- NEW: Auto-Populate Price Logic ---
  const handleProductSelect = (rowId, productId) => {
    const selectedProduct = products.find((p) => p.id === productId);
    const newCart = cart.map((item) => {
      if (item.rowId === rowId) {
        return {
          ...item,
          productId: productId,
          unitCost: selectedProduct ? selectedProduct.basePrice : item.unitCost, // Auto-fill price!
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const grandTotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
      0,
    );
  }, [cart]);

  const selectedProductIds = useMemo(
    () => cart.map((item) => item.productId).filter(Boolean),
    [cart],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceNumber || !locationId || cart.length === 0) {
      return toast.error("Please fill required fields and add items.");
    }

    const formattedItems = cart.map((item, index) => {
      if (!item.productId)
        throw new Error(`Please select a tyre for item #${index + 1}`);
      return {
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalCost: Number(item.quantity) * Number(item.unitCost),
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
          userId,
          items: formattedItems,
          totalAmount: grandTotal,
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-[#522874]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Destination Shop (Unload Here)
              </label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white"
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
              const lineTotal =
                (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
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
                      onSelect={(val) => handleProductSelect(item.rowId, val)} // <--- FIXED HERE
                    />
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-end gap-3">
                    <div className="flex-1 sm:flex-none sm:w-24">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Qty
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.rowId, "quantity", e.target.value)
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none h-[42px]"
                      />
                    </div>
                    <div className="flex-1 sm:flex-none sm:w-32">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Buying Cost
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={item.unitCost}
                        onChange={(e) =>
                          updateItem(item.rowId, "unitCost", e.target.value)
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none h-[42px]"
                        placeholder="₹0.00"
                      />
                    </div>
                    <div className="w-full sm:w-auto sm:flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-right font-black text-gray-800 h-[42px] flex items-center justify-end shadow-inner">
                      ₹{lineTotal.toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.rowId)}
                      className="h-[42px] w-[42px] shrink-0 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 bg-white border border-gray-200 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
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
            <div className="flex flex-col items-end gap-1 mt-4">
              <span className="text-sm font-bold text-white/80 uppercase">
                Total Purchase Value
              </span>
              <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md">
                ₹
                {grandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
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

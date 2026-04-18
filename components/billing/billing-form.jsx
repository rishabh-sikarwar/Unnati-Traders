"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Loader2,
  User,
  Truck,
  Receipt,
  Tag,
  Building2,
} from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector";

export default function BillingForm({
  inventory,
  locationId,
  userId,
  b2bCustomers,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState({
    id: null,
    b2b: true, // FIX: Defaulting to true (B2B Dealer)
    name: "",
    phone: "",
    address: "",
    gstNumber: "",
    paymentMode: "Cash",
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [initialPayment, setInitialPayment] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState("₹");
  const [cgst, setCgst] = useState("");
  const [cgstType, setCgstType] = useState("%");
  const [sgst, setSgst] = useState("");
  const [sgstType, setSgstType] = useState("%");

  const searchableInventory = useMemo(() => {
    return inventory.map((inv) => ({
      id: inv.id,
      modelName: inv.product.modelName,
      size: inv.product.size,
      sku: inv.product.sku,
    }));
  }, [inventory]);

  const selectedInventoryIds = useMemo(
    () => cart.map((item) => item.inventoryId).filter(Boolean),
    [cart],
  );

  const filteredB2BCustomers = useMemo(() => {
    if (!customer.name) return b2bCustomers;
    return b2bCustomers.filter((c) =>
      c.name.toLowerCase().includes(customer.name.toLowerCase()),
    );
  }, [customer.name, b2bCustomers]);

  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer({
      ...customer,
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      phone: selectedCustomer.phone || "",
      address: selectedCustomer.address || "",
      gstNumber: selectedCustomer.gstNumber || "",
    });
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addItem = () => {
    setCart([
      {
        rowId: Math.random().toString(36).substr(2, 9),
        inventoryId: "",
        quantity: 1,
        unitPrice: "",
        tyreCode: "",
      },
      ...cart,
    ]);
  };

  const updateItem = (id, field, value) => {
    const newCart = cart.map((item) =>
      item.rowId === id ? { ...item, [field]: value } : item,
    );
    setCart(newCart);
  };

  // --- FIX: Auto-Pricing Logic Restored ---
  const handleInventorySelect = (rowId, inventoryId) => {
    const selectedInv = inventory.find((i) => i.id === inventoryId);

    const newCart = cart.map((item) => {
      if (item.rowId === rowId) {
        return {
          ...item,
          inventoryId: inventoryId,
          // Auto-fill the price! Since it sets the state, you can still edit it in the input box manually.
          unitPrice: selectedInv?.product
            ? selectedInv.product.basePrice
            : item.unitPrice,
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const removeItem = (id) => setCart(cart.filter((item) => item.rowId !== id));

  const totals = useMemo(() => {
    let rawItemsTotal = 0;
    cart.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      rawItemsTotal += qty * price;
    });

    const dVal = Number(discount) || 0;
    const discountAmount =
      discountType === "%" ? rawItemsTotal * (dVal / 100) : dVal;
    const grandTotal = Math.max(0, rawItemsTotal - discountAmount);

    let taxableValue = grandTotal;
    const cVal = Number(cgst) || 0;
    const sVal = Number(sgst) || 0;

    let totalPct = 0;
    let totalFlat = 0;
    if (cgstType === "%") totalPct += cVal;
    else totalFlat += cVal;
    if (sgstType === "%") totalPct += sVal;
    else totalFlat += sVal;

    taxableValue = Math.max(0, (grandTotal - totalFlat) / (1 + totalPct / 100));

    return {
      rawItemsTotal,
      discountAmount,
      subtotal: taxableValue,
      totalGst:
        (cgstType === "%" ? taxableValue * (cVal / 100) : cVal) +
        (sgstType === "%" ? taxableValue * (sVal / 100) : sVal),
      grandTotal,
      cgstAmount: cgstType === "%" ? taxableValue * (cVal / 100) : cVal,
      sgstAmount: sgstType === "%" ? taxableValue * (sVal / 100) : sVal,
    };
  }, [cart, discount, discountType, cgst, cgstType, sgst, sgstType]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error("Cart is empty!");
    if (
      customer.paymentMode === "Credit" &&
      Number(initialPayment) > totals.grandTotal
    ) {
      return toast.error(
        "Initial payment cannot be greater than the Grand Total!",
      );
    }

    try {
      const formattedItems = cart.map((item, index) => {
        if (!item.inventoryId)
          throw new Error(`Please select a tyre for item #${index + 1}`);
        const invRecord = inventory.find((i) => i.id === item.inventoryId);
        if (!invRecord) throw new Error("Invalid tyre selected");

        const qty = Number(item.quantity);
        if (qty > invRecord.quantity)
          throw new Error(
            `Only ${invRecord.quantity} left for ${invRecord.product.modelName}`,
          );

        return {
          productId: invRecord.productId,
          modelName: invRecord.product.modelName,
          quantity: qty,
          unitPrice: Number(item.unitPrice),
          totalPrice: qty * Number(item.unitPrice),
          tyreCode: item.tyreCode,
        };
      });

      setLoading(true);
      const loadingToast = toast.loading("Generating Bill...");

      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo: { ...customer, initialPayment: initialPayment },
          items: formattedItems,
          locationId,
          userId,
          totals,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Invoice Generated!", { id: loadingToast });
      router.push(`/billing/receipt/${data.invoiceId}`);
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleCheckout}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        {/* CUSTOMER INFO */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-[#522874]" /> Customer Details
            </h2>
            <div className="flex items-center gap-2 text-sm font-bold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 self-start sm:self-auto">
              <span
                className={!customer.b2b ? "text-[#522874]" : "text-gray-400"}
              >
                B2C (Retail)
              </span>
              <button
                type="button"
                onClick={() =>
                  setCustomer({
                    ...customer,
                    id: null,
                    b2b: !customer.b2b,
                    gstNumber: "",
                  })
                }
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${customer.b2b ? "bg-[#522874]" : "bg-gray-300"}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${customer.b2b ? "translate-x-6" : ""}`}
                />
              </button>
              <span
                className={customer.b2b ? "text-[#522874]" : "text-gray-400"}
              >
                B2B (Dealer)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SMART AUTOCOMPLETE FIELD */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                {customer.b2b ? "Dealer Shop Name" : "Customer Name"}
              </label>
              <input
                required
                value={customer.name}
                onFocus={() => customer.b2b && setShowDropdown(true)}
                onChange={(e) => {
                  setCustomer({ ...customer, name: e.target.value, id: null });
                  if (customer.b2b) setShowDropdown(true);
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all ${customer.id ? "bg-purple-50 border-purple-300 font-bold text-[#522874]" : "border-gray-300"}`}
                placeholder={
                  customer.b2b ? "Search existing dealer..." : "e.g. Rahul"
                }
                autoComplete="off"
              />

              {customer.b2b && showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredB2BCustomers.length > 0 ? (
                    filteredB2BCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleCustomerSelect(c)}
                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-gray-800">
                            {c.name}
                          </div>
                          {c.phone && (
                            <div className="text-xs text-gray-500">
                              {c.phone}
                            </div>
                          )}
                        </div>
                        <Building2 className="w-4 h-4 text-gray-400" />
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 italic flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create new dealer: "
                      {customer.name}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
                placeholder="9876543210"
              />
            </div>

            {customer.b2b && (
              <div className="sm:col-span-2 animate-in fade-in zoom-in duration-300">
                <label className="block text-xs font-bold text-[#522874] uppercase mb-1">
                  GST Number (Optional)
                </label>
                <input
                  value={customer.gstNumber}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      gstNumber: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2.5 border border-purple-200 bg-purple-50 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all uppercase font-bold text-gray-800"
                  placeholder="23XXXXX..."
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Address / Notes
              </label>
              <input
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
                placeholder="Optional notes or shipping address..."
              />
            </div>
          </div>
        </div>

        {/* CART */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#522874]" /> Material / Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm bg-purple-50 text-[#522874] px-4 py-2 rounded-md font-bold hover:bg-purple-100 flex items-center gap-1 transition-colors cursor-pointer active:scale-95 border border-purple-200"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {cart.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium bg-gray-50">
                Click{" "}
                <span className="text-[#522874] font-bold">"Add Item"</span> to
                start billing tyres.
              </div>
            )}

            {cart.map((item) => {
              const selectedInv = inventory.find(
                (i) => i.id === item.inventoryId,
              );
              const maxStock = selectedInv ? selectedInv.quantity : 0;
              const lineTotal =
                (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
              const availableInventory = searchableInventory.filter(
                (inv) =>
                  !selectedInventoryIds.includes(inv.id) ||
                  inv.id === item.inventoryId,
              );

              return (
                <div
                  key={item.rowId}
                  className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm relative group animate-in fade-in slide-in-from-top-4 duration-300"
                >
                  <div className="w-full relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Select Tyre
                    </label>
                    <SmartTyreSelector
                      products={availableInventory}
                      selectedProductId={item.inventoryId}
                      onSelect={(val) => handleInventorySelect(item.rowId, val)} // FIX: Using handleInventorySelect to auto-fetch price
                    />
                  </div>

                  <div className="w-full relative">
                    <label className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase mb-1">
                      <Tag className="w-3 h-3" /> Unique Tyre Code / Serial No.
                      (Warranty)
                    </label>
                    <input
                      type="text"
                      value={item.tyreCode}
                      onChange={(e) =>
                        updateItem(
                          item.rowId,
                          "tyreCode",
                          e.target.value.toUpperCase(),
                        )
                      }
                      className="w-full px-3 py-2 border border-orange-200 bg-orange-50/50 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm uppercase placeholder-gray-400"
                      placeholder="e.g. AP12345"
                    />
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 mt-1">
                    <div className="flex-1 sm:flex-none sm:w-24">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 truncate">
                        Qty{" "}
                        <span className="text-purple-600">({maxStock})</span>
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        max={maxStock || 1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.rowId, "quantity", e.target.value)
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none h-[42px] transition-all"
                      />
                    </div>
                    <div className="flex-1 sm:flex-none sm:w-36">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 truncate">
                        Unit Price (Inc. Tax)
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.rowId, "unitPrice", e.target.value)
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none h-[42px] transition-all font-bold text-gray-800"
                        placeholder="₹0.00"
                      />
                    </div>
                    <div className="w-full sm:w-auto sm:flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-right font-black text-gray-800 h-[42px] flex items-center justify-end shadow-inner">
                      ₹
                      {lineTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.rowId)}
                      className="h-[42px] w-[42px] shrink-0 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 bg-white border border-gray-200 rounded-lg transition-all active:scale-95 shadow-sm cursor-pointer"
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

      {/* RIGHT COLUMN: Invoice Summary */}
      <div className="space-y-6">
        <div className="bg-[#3d1d56] text-white p-6 md:p-8 rounded-xl shadow-lg lg:sticky lg:top-28 border border-[#522874]">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <Receipt className="w-5 h-5 text-purple-300" /> Invoice Summary
          </h2>

          <div className="space-y-4 mb-6 text-sm font-medium">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Items Total</span>
              <span className="text-base font-bold">
                ₹
                {totals.rawItemsTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
              <span className="text-white/90">Discount</span>
              <div className="flex items-center gap-2">
                <div className="flex bg-black/20 rounded overflow-hidden border border-white/10">
                  <button
                    type="button"
                    onClick={() => setDiscountType("₹")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${discountType === "₹" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("%")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${discountType === "%" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-20 px-2 py-1.5 bg-white/10 border border-white/20 rounded text-right outline-none focus:border-purple-300 focus:bg-white/20 transition-all text-white placeholder-white/30"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="font-bold text-white/80">Taxable Value</span>
              <span className="font-bold text-base text-white/80">
                ₹
                {totals.subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
              <span className="text-white/90">CGST</span>
              <div className="flex items-center gap-2">
                <div className="flex bg-black/20 rounded overflow-hidden border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCgstType("₹")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${cgstType === "₹" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => setCgstType("%")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${cgstType === "%" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={cgst}
                  onChange={(e) => setCgst(e.target.value)}
                  className="w-20 px-2 py-1.5 bg-white/10 border border-white/20 rounded text-right outline-none focus:border-purple-300 focus:bg-white/20 transition-all text-white placeholder-white/30"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
              <span className="text-white/90">SGST</span>
              <div className="flex items-center gap-2">
                <div className="flex bg-black/20 rounded overflow-hidden border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSgstType("₹")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${sgstType === "₹" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => setSgstType("%")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${sgstType === "%" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={sgst}
                  onChange={(e) => setSgst(e.target.value)}
                  className="w-20 px-2 py-1.5 bg-white/10 border border-white/20 rounded text-right outline-none focus:border-purple-300 focus:bg-white/20 transition-all text-white placeholder-white/30"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="text-center mt-2">
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                Tax is calculated inclusively
              </span>
            </div>
          </div>

          <div className="border-t border-white/20 pt-5 mb-6">
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold text-white">Grand Total</span>
              <span className="text-3xl md:text-4xl font-black text-green-400 drop-shadow-md">
                ₹
                {totals.grandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-bold text-purple-200 uppercase mb-2">
              Payment Mode
            </label>
            <select
              value={customer.paymentMode}
              onChange={(e) => {
                setCustomer({ ...customer, paymentMode: e.target.value });
                setInitialPayment("");
              }}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-bold outline-none cursor-pointer focus:border-purple-300 transition-all"
            >
              <option className="text-black font-medium" value="Cash">
                Cash 💵
              </option>
              <option className="text-black font-medium" value="UPI">
                UPI 📱
              </option>
              <option className="text-black font-medium" value="Card">
                Credit/Debit Card 💳
              </option>
              <option className="text-black font-bold" value="Credit">
                Udhaar 🏦
              </option>
            </select>

            {customer.paymentMode === "Credit" && (
              <div className="mt-4 animate-in fade-in zoom-in duration-300 bg-black/20 p-4 rounded-xl border border-orange-500/30">
                <label className="block text-xs font-bold text-orange-300 uppercase mb-2">
                  Initial Payment Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totals.grandTotal}
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-orange-400/50 rounded-lg text-white font-bold outline-none focus:border-orange-400 transition-all placeholder-white/30"
                  placeholder="e.g. 500"
                />
                <div className="flex justify-between mt-2 text-sm font-medium">
                  <span className="text-white/70">Remaining Udhaar:</span>
                  <span className="text-orange-400 font-bold">
                    ₹
                    {Math.max(
                      0,
                      totals.grandTotal - (Number(initialPayment) || 0),
                    ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
            {loading ? "Generating Bill..." : "GENERATE BILL"}
          </button>
        </div>
      </div>
    </form>
  );
}

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
  SplitSquareHorizontal,
  Calendar,
  X,
} from "lucide-react";
import SmartTyreSelector from "@/components/shared/smart-tyre-selector";
import { formatNumber } from "@/lib/format";
import { toDecimal, moneyToString } from "@/lib/money";

export default function BillingForm({
  inventory,
  locationId,
  userId,
  b2bCustomers,
  dealerOrderId: propDealerOrderId = null,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedDealerOrderId, setLoadedDealerOrderId] = useState(null);

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const todayStr = new Date().toISOString().split("T")[0];

  const [customer, setCustomer] = useState({
    id: null,
    b2b: true, // FIX: Defaulting to true (B2B Dealer)
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    paymentMode: "Cash",
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [initialPayment, setInitialPayment] = useState(""); // Used for simple CREDIT
  const [splitPayments, setSplitPayments] = useState({
    cash: "",
    upi: "",
    card: "",
  }); // Used for MULTIPLE
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState("₹");
  const [cgst, setCgst] = useState("");
  const [cgstType, setCgstType] = useState("%");
  const [sgst, setSgst] = useState("");
  const [sgstType, setSgstType] = useState("%");
  const [igst, setIgst] = useState("");
  const [igstType, setIgstType] = useState("%");

  const searchableInventory = useMemo(() => {
    return inventory.map((inv) => ({
      id: inv.id,
      modelName: inv.product.modelName,
      size: inv.product.size,
      brand: inv.product.brand || "",
      sku: inv.product.sku,
      hsnCode: inv.product.hsnCode || "",
      hasTube: Boolean(inv.product.hasTube),
      tubeName: inv.product.tubeName || "",
      tubePrice: inv.product.tubePrice ? Number(inv.product.tubePrice) : 0,
      hasFlap: Boolean(inv.product.hasFlap),
      flapName: inv.product.flapName || "",
      flapPrice: inv.product.flapPrice ? Number(inv.product.flapPrice) : 0,
    }));
  }, [inventory]);

  const selectedInventoryIds = useMemo(
    () => cart.map((item) => item.inventoryId).filter(Boolean),
    [cart],
  );

  const filteredB2BCustomers = useMemo(() => {
    let list = b2bCustomers;
    if (customer.name) {
      list = b2bCustomers.filter((c) =>
        c.name.toLowerCase().includes(customer.name.toLowerCase()),
      );
    }
    // Remove duplicate names
    const uniqueMap = new Map();
    list.forEach((c) => uniqueMap.set(c.name.toLowerCase().trim(), c));
    return Array.from(uniqueMap.values());
  }, [customer.name, b2bCustomers]);

  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer({
      ...customer,
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      phone: selectedCustomer.phone || "",
      email: selectedCustomer.email || "",
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

  // --- AUTO-POPULATE DEALER ORDER ---
  useEffect(() => {
    const urlId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("dealerOrderId")
        : null;
    const orderIdToLoad = propDealerOrderId || urlId;

    if (!orderIdToLoad || orderIdToLoad === loadedDealerOrderId) return;

    let isMounted = true;
    async function loadDealerOrder() {
      try {
        const res = await fetch(`/api/dealer-orders/${orderIdToLoad}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to load dealer order.");
        }
        const data = await res.json();
        if (!isMounted || !data.order) return;

        const order = data.order;
        setLoadedDealerOrderId(order.id);

        // 1. Auto-fill Customer selection field
        if (order.customer) {
          setCustomer((prev) => ({
            ...prev,
            id: order.customer.id || null,
            b2b: true,
            name: order.customer.name || "",
            phone: order.customer.phone || "",
            email: order.customer.email || "",
            address: order.customer.address || "",
            gstNumber: order.customer.gstNumber || "",
          }));
        }

        // 2. Auto-fill Material/Items array with requested tyres & quantities
        // 3. Stock Validation & Toast Notifications
        let hasZeroStock = false;
        let hasAdjustedQty = false;

        const populatedCart = [];

        for (const item of order.items) {
          // Find matching inventory record in local shop inventory
          let localInv = inventory.find((inv) => inv.id === item.inventoryId);
          if (!localInv && item.productId) {
            localInv = inventory.find((inv) => inv.productId === item.productId);
          }

          const actualStock = localInv
            ? Number(localInv.quantity)
            : Number(item.actualShopStock || 0);
          const reqQty = Number(item.requestedQuantity) || 1;
          let assignedQty = reqQty;

          if (actualStock <= 0) {
            hasZeroStock = true;
            toast.error(
              `Tyre ${item.modelName} is completely out of stock! Please remove it or arrange stock.`,
              { duration: 7000 }
            );
            assignedQty = 0;
          } else if (reqQty > actualStock) {
            hasAdjustedQty = true;
            assignedQty = actualStock;
            toast.error(
              `Dealer requested ${reqQty} of Tyre ${item.modelName}, but only ${actualStock} available. Quantity adjusted.`,
              { duration: 7000 }
            );
          }

          const prod = localInv?.product;
          populatedCart.push({
            rowId: Math.random().toString(36).substr(2, 9),
            inventoryId: localInv ? localInv.id : item.inventoryId || "",
            quantity: assignedQty,
            unitPrice: "", // Leave unit prices blank (or 0) so the shopkeeper is forced to input them manually
            tyreCode: "",
            includeTube: Boolean(prod?.hasTube),
            tubeName: prod?.hasTube ? prod.tubeName || "" : "",
            tubePrice: prod?.hasTube ? Number(prod.tubePrice || 0) : "",
            includeFlap: Boolean(prod?.hasFlap),
            flapName: prod?.hasFlap ? prod.flapName || "" : "",
            flapPrice: prod?.hasFlap ? Number(prod.flapPrice || 0) : "",
            isLocked: true,
          });
        }

        setCart(populatedCart);

        // Toast success if all items are perfectly in stock
        if (!hasZeroStock && !hasAdjustedQty && order.items.length > 0) {
          toast.success("Dealer request loaded successfully.");
        }
      } catch (err) {
        console.error("Failed to auto-populate dealer order:", err);
        toast.error(err.message || "Failed to load dealer order details.");
      }
    }

    loadDealerOrder();

    return () => {
      isMounted = false;
    };
  }, [propDealerOrderId, inventory, loadedDealerOrderId]);

  const addItem = () => {
    setCart([
      {
        rowId: Math.random().toString(36).substr(2, 9),
        inventoryId: "",
        quantity: 1,
        unitPrice: "",
        tyreCode: "",
        includeTube: false,
        tubeName: "",
        tubePrice: "",
        includeFlap: false,
        flapName: "",
        flapPrice: "",
        isLocked: false,
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

  // --- FIX: Auto-Pricing & TTF Auto-Population Logic ---
  const handleInventorySelect = (rowId, inventoryId) => {
    const selectedInv = inventory.find((i) => i.id === inventoryId);
    const prod = selectedInv?.product;

    const newCart = cart.map((item) => {
      if (item.rowId === rowId) {
        return {
          ...item,
          inventoryId: inventoryId,
          // Auto-fill tyre price
          unitPrice: prod ? prod.basePrice : item.unitPrice,
          // Auto-populate TTF set components if tyre has hasTube / hasFlap
          includeTube: Boolean(prod?.hasTube),
          tubeName: prod?.hasTube ? prod.tubeName || "" : "",
          tubePrice: prod?.hasTube ? Number(prod.tubePrice || 0) : "",
          includeFlap: Boolean(prod?.hasFlap),
          flapName: prod?.hasFlap ? prod.flapName || "" : "",
          flapPrice: prod?.hasFlap ? Number(prod.flapPrice || 0) : "",
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const removeItem = (id) => setCart(cart.filter((item) => item.rowId !== id));

  const totals = useMemo(() => {
    let rawItemsTotal = toDecimal(0);
    cart.forEach((item) => {
      const tyreRate = toDecimal(item.unitPrice || 0);
      const tubeRate = item.includeTube ? toDecimal(item.tubePrice || 0) : toDecimal(0);
      const flapRate = item.includeFlap ? toDecimal(item.flapPrice || 0) : toDecimal(0);
      const combinedUnitRate = tyreRate.plus(tubeRate).plus(flapRate);
      const lineTotal = toDecimal(item.quantity || 0).times(combinedUnitRate);
      rawItemsTotal = rawItemsTotal.plus(lineTotal);
    });

    const dVal = toDecimal(discount);
    const discountAmount =
      discountType === "%" ? rawItemsTotal.times(dVal).div(100) : dVal;
    const grandTotal = rawItemsTotal.minus(discountAmount);
    const safeGrandTotal = grandTotal.gt(0) ? grandTotal : toDecimal(0);

    const cVal = toDecimal(cgst);
    const sVal = toDecimal(sgst);
    const iVal = toDecimal(igst);
    let totalPct = toDecimal(0);
    let totalFlat = toDecimal(0);

    if (cgstType === "%") totalPct = totalPct.plus(cVal);
    else totalFlat = totalFlat.plus(cVal);
    if (sgstType === "%") totalPct = totalPct.plus(sVal);
    else totalFlat = totalFlat.plus(sVal);
    if (igstType === "%") totalPct = totalPct.plus(iVal);
    else totalFlat = totalFlat.plus(iVal);

    const taxableValue = safeGrandTotal
      .minus(totalFlat)
      .div(toDecimal(1).plus(totalPct.div(100)));
    const safeTaxableValue = taxableValue.gt(0) ? taxableValue : toDecimal(0);

    const subtotal = safeTaxableValue;
    const cgstAmount = cgstType === "%" ? safeTaxableValue.times(cVal).div(100) : cVal;
    const sgstAmount = sgstType === "%" ? safeTaxableValue.times(sVal).div(100) : sVal;
    const igstAmount = igstType === "%" ? safeTaxableValue.times(iVal).div(100) : iVal;
    const totalGst = cgstAmount.plus(sgstAmount).plus(igstAmount);

    const exactTotal = subtotal.plus(totalGst);
    const roundedTotal = exactTotal.ceil();
    const roundOffAmount = roundedTotal.minus(exactTotal);

    return {
      rawItemsTotal,
      discountAmount,
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGst,
      exactTotal,
      grandTotal: roundedTotal,
      roundOffAmount,
    };
  }, [
    cart,
    discount,
    discountType,
    cgst,
    cgstType,
    sgst,
    sgstType,
    igst,
    igstType,
  ]);

  // GST Mutual Exclusivity Handlers: Intra-state (CGST + SGST) vs Inter-state (IGST)
  const handleCgstChange = (val) => {
    setCgst(val);
    if (val && Number(val) > 0) {
      setIgst("");
      if (cgstType === "%") {
        setSgst(val);
        setSgstType("%");
      }
    }
  };

  const handleSgstChange = (val) => {
    setSgst(val);
    if (val && Number(val) > 0) {
      setIgst("");
      if (sgstType === "%") {
        setCgst(val);
        setCgstType("%");
      }
    }
  };

  const handleIgstChange = (val) => {
    setIgst(val);
    if (val && Number(val) > 0) {
      setCgst("");
      setSgst("");
    }
  };

  const handleCgstTypeChange = (type) => {
    setCgstType(type);
    if (type === "%" && cgst && Number(cgst) > 0) {
      setSgstType("%");
      setSgst(cgst);
    }
  };

  const handleSgstTypeChange = (type) => {
    setSgstType(type);
    if (type === "%" && sgst && Number(sgst) > 0) {
      setCgstType("%");
      setCgst(sgst);
    }
  };

  const handleIgstTypeChange = (type) => {
    setIgstType(type);
    if (igst && Number(igst) > 0) {
      setCgst("");
      setSgst("");
    }
  };

  // CALCULATE SPLIT AMOUNTS
  const totalSplitPaid = toDecimal(splitPayments.cash)
    .plus(toDecimal(splitPayments.upi))
    .plus(toDecimal(splitPayments.card));
  const remainingSplitDue = totals.grandTotal.minus(totalSplitPaid);
  const safeRemainingSplitDue = remainingSplitDue.gt(0)
    ? remainingSplitDue
    : toDecimal(0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (cart.length === 0) {
      setIsSubmitting(false);
      return toast.error("Cart is empty!");
    }

    if (
      customer.paymentMode === "Credit" &&
      toDecimal(initialPayment).gt(totals.grandTotal)
    ) {
      setIsSubmitting(false);
      return toast.error("Initial payment cannot be greater than Total!");
    }
    if (
      customer.paymentMode === "Multiple" &&
      totalSplitPaid.gt(totals.grandTotal)
    ) {
      setIsSubmitting(false);
      return toast.error("Split payments exceed the Grand Total!");
    }

    try {
      const formattedItems = cart.map((item, index) => {
        if (!item.inventoryId)
          throw new Error(`Please select a tyre for item #${index + 1}`);
        const invRecord = inventory.find((i) => i.id === item.inventoryId);
        const qty = Number(item.quantity);
        if (qty <= 0)
          throw new Error(
            `Quantity for ${invRecord?.product?.modelName || `item #${index + 1}`} must be at least 1. Please adjust quantity or remove out-of-stock item.`
          );
        if (qty > invRecord.quantity)
          throw new Error(
            `Only ${invRecord.quantity} left for ${invRecord.product.modelName}`,
          );
        if (!item.unitPrice || Number(item.unitPrice) <= 0)
          throw new Error(
            `Please enter a valid unit rate for ${invRecord.product.modelName}.`
          );

        const tyreRate = toDecimal(item.unitPrice || 0);
        const tubeRate = item.includeTube ? toDecimal(item.tubePrice || 0) : toDecimal(0);
        const flapRate = item.includeFlap ? toDecimal(item.flapPrice || 0) : toDecimal(0);
        const combinedUnitRate = tyreRate.plus(tubeRate).plus(flapRate);
        const lineTotal = toDecimal(qty).times(combinedUnitRate);

        return {
          productId: invRecord.productId,
          modelName: invRecord.product.modelName,
          quantity: qty,
          unitPrice: moneyToString(item.unitPrice),
          totalPrice: moneyToString(lineTotal),
          tyreCode: item.tyreCode,
          includeTube: Boolean(item.includeTube),
          tubeName: item.includeTube ? (item.tubeName || `${invRecord.product.modelName} Tube`) : null,
          tubePrice: item.includeTube && item.tubePrice ? moneyToString(item.tubePrice) : 0,
          includeFlap: Boolean(item.includeFlap),
          flapName: item.includeFlap ? (item.flapName || `${invRecord.product.modelName} Flap`) : null,
          flapPrice: item.includeFlap && item.flapPrice ? moneyToString(item.flapPrice) : 0,
        };
      });

      setLoading(true);
      const loadingToast = toast.loading("Generating Bill...");

      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo: { ...customer, initialPayment, splitPayments },
          items: formattedItems,
          locationId,
          userId,
          totals,
          invoiceDate,
          dealerOrderId: loadedDealerOrderId || propDealerOrderId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Invoice Generated!", { id: loadingToast });
      setIsRedirecting(true);
      router.push(`/billing/receipt/${data.invoiceId}`);
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleCheckout}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        {/* DEALER ORDER NOTICE */}
        {loadedDealerOrderId && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#522874] text-white text-xs font-bold px-2.5 py-1 rounded-md">
                Dealer Order
              </span>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  Fulfilling Wholesale Booking
                </p>
                <p className="text-[11px] text-gray-500">
                  Customer and requested tyres loaded. Please verify stock, input agreed unit rates, and select payment mode.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#522874] bg-white px-2.5 py-1 rounded-lg border border-purple-100">
              ID: {loadedDealerOrderId.slice(0, 8)}...
            </span>
          </div>
        )}

        {/* CUSTOMER INFO */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-[#522874]" /> Customer Details
            </h2>
            <div className="flex flex-wrap items-center gap-4 self-start sm:self-auto">
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                <Calendar className="w-4 h-4 text-[#522874]" />
                <input
                  type="date"
                  max={todayStr}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="bg-transparent text-sm font-bold text-[#522874] outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 text-sm font-bold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                maxLength="10"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    phone: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={customer.email}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    email: e.target.value,
                  })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
                placeholder="customer@example.com"
              />
            </div>

            {customer.b2b && (
              <div className="sm:col-span-3 animate-in fade-in zoom-in duration-300">
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

            <div className="sm:col-span-3">
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
              const tyreRate = toDecimal(item.unitPrice || 0);
              const tubeRate = item.includeTube ? toDecimal(item.tubePrice || 0) : toDecimal(0);
              const flapRate = item.includeFlap ? toDecimal(item.flapPrice || 0) : toDecimal(0);
              const combinedUnitRate = tyreRate.plus(tubeRate).plus(flapRate);
              const lineTotal = toDecimal(item.quantity || 0).times(combinedUnitRate);

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
                      locked={item.isLocked}
                    />
                    <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                      <span className="shrink-0">HSN</span>
                      <div className="flex-1 min-h-[24px] rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-800">
                        {selectedInv?.product?.hsnCode || ""}
                      </div>
                    </div>
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

                  {/* ROW 1: MAIN TYRE QUANTITY & UNIT PRICE */}
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
                        step="1"
                        max={maxStock || 1}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseInt(val, 10);
                          updateItem(item.rowId, "quantity", isNaN(parsed) ? "" : parsed);
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none h-[42px] transition-all"
                      />
                    </div>
                    <div className="flex-1 sm:flex-none sm:w-36">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 truncate">
                        {item.includeTube || item.includeFlap ? "Tyre Rate (₹)" : "Unit Price (Inc. Tax)"}
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.rowId, "unitPrice", e.target.value)
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none h-[42px] transition-all font-bold text-gray-800"
                        placeholder="₹0.00"
                      />
                    </div>
                    <div className="w-full sm:w-auto sm:flex-1 bg-white border border-gray-200 px-4 py-2 rounded-lg text-right h-[42px] flex flex-col justify-center shadow-inner">
                      <div className="font-black text-gray-800 leading-tight">
                        {`₹${formatNumber(lineTotal, 2)}`}
                      </div>
                      {(item.includeTube || item.includeFlap) && (
                        <div className="text-[10px] text-gray-500 font-mono">
                          Set: ₹{formatNumber(combinedUnitRate, 2)}/ea
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.rowId)}
                      className="h-[42px] w-[42px] shrink-0 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 bg-white border border-gray-200 rounded-lg transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* ROW 2: TUBE (IF INCLUDED) */}
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
                            Qty (Locked)
                          </label>
                          <div className="h-[38px] px-3 bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-center cursor-not-allowed select-none">
                            {item.quantity || 1}
                          </div>
                        </div>

                        <div className="w-28 sm:w-36 shrink-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 truncate">
                            Tube Rate (₹)
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
                            title="Remove tube (sell loose tyre only)"
                          >
                            <X className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ROW 3: FLAP (IF INCLUDED) */}
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
                            Qty (Locked)
                          </label>
                          <div className="h-[38px] px-3 bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-center cursor-not-allowed select-none">
                            {item.quantity || 1}
                          </div>
                        </div>

                        <div className="w-28 sm:w-36 shrink-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 truncate">
                            Flap Rate (₹)
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
                        Add to Set:
                      </span>
                      {!item.includeTube && (
                        <button
                          type="button"
                          onClick={() => {
                            const defaultName = selectedInv?.product?.tubeName || `${selectedInv?.product?.size || ""} APOLLO TUBE`.trim();
                            const defaultPrice = selectedInv?.product?.tubePrice ? Number(selectedInv.product.tubePrice) : "";
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
                            const defaultName = selectedInv?.product?.flapName || `${selectedInv?.product?.size || ""} RADIAL FLAP`.trim();
                            const defaultPrice = selectedInv?.product?.flapPrice ? Number(selectedInv.product.flapPrice) : "";
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

      {/* RIGHT COLUMN: Invoice Summary */}
      <div className="space-y-6">
        <div className="bg-[#3d1d56] text-white p-6 md:p-8 rounded-xl shadow-lg lg:sticky lg:top-28 border border-[#522874]">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <Receipt className="w-5 h-5 text-purple-300" /> Invoice Summary
          </h2>

          <div className="space-y-4 mb-6 text-sm font-medium">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Items Total</span>
              <span className="text-base font-bold">{`₹${formatNumber(
                totals.rawItemsTotal,
                2,
              )}`}</span>
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
                  step="0.01"
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
                {`₹${formatNumber(totals.subtotal, 2)}`}
              </span>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
              <span className="text-white/90">CGST</span>
              <div className="flex items-center gap-2">
                <div className="flex bg-black/20 rounded overflow-hidden border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleCgstTypeChange("₹")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${cgstType === "₹" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCgstTypeChange("%")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${cgstType === "%" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cgst}
                  onChange={(e) => handleCgstChange(e.target.value)}
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
                    onClick={() => handleSgstTypeChange("₹")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${sgstType === "₹" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSgstTypeChange("%")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${sgstType === "%" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sgst}
                  onChange={(e) => handleSgstChange(e.target.value)}
                  className="w-20 px-2 py-1.5 bg-white/10 border border-white/20 rounded text-right outline-none focus:border-purple-300 focus:bg-white/20 transition-all text-white placeholder-white/30"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10 mt-4">
              <span className="text-white/90">IGST</span>
              <div className="flex items-center gap-2">
                <div className="flex bg-black/20 rounded overflow-hidden border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleIgstTypeChange("₹")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${igstType === "₹" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIgstTypeChange("%")}
                    className={`px-2 py-1 text-xs font-bold transition-colors cursor-pointer ${igstType === "%" ? "bg-purple-400 text-white" : "text-white/50 hover:text-white/80"}`}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={igst}
                  onChange={(e) => handleIgstChange(e.target.value)}
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

            {totals.roundOffAmount.gt(0) && (
              <div className="flex justify-between items-center text-xs text-white/60 pt-2 border-t border-white/10">
                <span>Round Off</span>
                <span>+₹{totals.roundOffAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-white/20 pt-5 mb-6 mt-6">
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold text-white">Grand Total</span>
              <span className="text-3xl md:text-4xl font-black text-green-400 drop-shadow-md">
                {`₹${formatNumber(totals.grandTotal, 2)}`}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-bold text-purple-200 uppercase mb-2">
              Payment Mode
            </label>
            <select
              value={customer.paymentMode}
              onChange={(e) =>
                setCustomer({ ...customer, paymentMode: e.target.value })
              }
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
                Udhaar (Single Payment) 🏦
              </option>
              <option className="text-black font-bold" value="Multiple">
                Split Payment (Multiple) 🔀
              </option>
            </select>

            {/* UI FOR SIMPLE UDHAAR */}
            {customer.paymentMode === "Credit" && (
              <div className="mt-4 animate-in fade-in zoom-in duration-300 bg-black/20 p-4 rounded-xl border border-orange-500/30">
                <label className="block text-xs font-bold text-orange-300 uppercase mb-2">
                  Initial Payment Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={moneyToString(totals.grandTotal)}
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-orange-400/50 rounded-lg text-white font-bold outline-none focus:border-orange-400 transition-all placeholder-white/30"
                  placeholder="e.g. 500"
                />
                <div className="flex justify-between mt-2 text-sm font-medium">
                  <span className="text-white/70">Remaining Udhaar:</span>
                  <span className="text-orange-400 font-bold">
                    {`₹${formatNumber(
                      totals.grandTotal.minus(toDecimal(initialPayment)).gt(0)
                        ? totals.grandTotal.minus(toDecimal(initialPayment))
                        : toDecimal(0),
                      2,
                    )}`}
                  </span>
                </div>
              </div>
            )}

            {/* UI FOR SPLIT PAYMENTS */}
            {customer.paymentMode === "Multiple" && (
              <div className="mt-4 animate-in fade-in zoom-in duration-300 bg-black/20 p-4 rounded-xl border border-blue-500/30 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-blue-300 uppercase mb-1">
                  <span>Split the Bill</span>
                  <SplitSquareHorizontal className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-3">
                  <label className="w-16 text-sm font-bold text-white/80">
                    Cash
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={splitPayments.cash}
                    onChange={(e) =>
                      setSplitPayments({
                        ...splitPayments,
                        cash: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold outline-none focus:border-blue-400"
                    placeholder="₹0"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16 text-sm font-bold text-white/80">
                    UPI
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={splitPayments.upi}
                    onChange={(e) =>
                      setSplitPayments({
                        ...splitPayments,
                        upi: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold outline-none focus:border-blue-400"
                    placeholder="₹0"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16 text-sm font-bold text-white/80">
                    Card
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={splitPayments.card}
                    onChange={(e) =>
                      setSplitPayments({
                        ...splitPayments,
                        card: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold outline-none focus:border-blue-400"
                    placeholder="₹0"
                  />
                </div>

                <div className="flex justify-between mt-4 pt-3 border-t border-blue-500/30 text-sm font-medium">
                  <span className="text-white/70">Goes to Udhaar:</span>
                  <span className="text-blue-400 font-bold">
                    {`₹${formatNumber(safeRemainingSplitDue, 2)}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || loading || isRedirecting || cart.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          >
            {loading || isRedirecting ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
            {isRedirecting ? "Redirecting to Receipt..." : loading ? "Generating Bill..." : "GENERATE BILL"}
          </button>
        </div>
      </div>
    </form>
  );
}

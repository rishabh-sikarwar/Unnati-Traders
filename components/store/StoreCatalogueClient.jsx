"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  Phone,
  ArrowRight,
  Loader2,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function StoreCatalogueClient({
  user,
  locations = [],
  products = [],
  initialPhone = "",
  initialSearch = "",
}) {
  const router = useRouter();

  // Selected shop
  const [selectedShopId, setSelectedShopId] = useState(
    locations[0]?.id || ""
  );

  // Cart state: { [productId]: { product, quantity } }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedBrand, setSelectedBrand] = useState("ALL");

  // Phone number modal state
  const [phone, setPhone] = useState(initialPhone);
  const [showPhoneModal, setShowPhoneModal] = useState(!initialPhone);
  const [phoneInput, setPhoneInput] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  // Unique brands
  const brands = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return ["ALL", ...Array.from(set)];
  }, [products]);

  // Selected shop object
  const currentShop = locations.find((l) => l.id === selectedShopId) || locations[0];

  // Filter products: matching query & brand (Backorder / indent system: all active products shown)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedBrand !== "ALL" && product.brand !== selectedBrand) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchModel =
          product.modelName?.toLowerCase().includes(q) ||
          product.name?.toLowerCase().includes(q) ||
          product.model?.toLowerCase().includes(q);
        const matchSize = product.size?.toLowerCase().includes(q);
        const matchBrand = product.brand?.toLowerCase().includes(q);
        const matchSku = product.sku?.toLowerCase().includes(q);
        const matchDesc = product.description?.toLowerCase().includes(q);
        if (!matchModel && !matchSize && !matchBrand && !matchSku && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedBrand, searchQuery]);

  // Cart helpers
  const totalCartItems = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    setCart((prev) => {
      const existing = prev[product.id]?.quantity || 0;
      const newQty = existing + qtyToAdd;
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: newQty,
        },
      };
    });
    toast.success(`Added ${product.modelName} to booking`);
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }

      return {
        ...prev,
        [productId]: {
          ...item,
          quantity: newQty,
        },
      };
    });
  };

  const setCartItemQuantity = (productId, rawQuantity) => {
    const parsed = parseInt(rawQuantity, 10);
    if (isNaN(parsed) || parsed <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      return {
        ...prev,
        [productId]: {
          ...item,
          quantity: parsed,
        },
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Phone submission handler
  const handleSavePhone = async (e) => {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, "");
    if (clean.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSavingPhone(true);
    try {
      const res = await fetch("/api/customers/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update phone number");

      setPhone(clean);
      setShowPhoneModal(false);
      toast.success("Phone number saved successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Order checkout handler
  const handlePlaceOrder = async () => {
    if (!phone) {
      setShowPhoneModal(true);
      toast.error("Mobile number is required before placing wholesale bookings.");
      return;
    }

    const cartEntries = Object.values(cart);
    if (cartEntries.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        locationId: selectedShopId,
        notes: orderNotes,
        items: cartEntries.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await fetch("/api/dealer-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order.");

      toast.success("Order booking submitted successfully!");
      setCart({});
      setIsCartOpen(false);
      router.push(`/store/orders/${data.orderId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-28 md:pt-32 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Welcome Banner */}
        <div className="bg-gradient-to-r from-[#522874] to-[#71349f] rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>B2B Wholesale Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Tyre Catalogue & Booking
            </h1>
            <p className="text-purple-100 text-sm max-w-xl">
              Browse the complete tyre catalogue and place wholesale bookings in any quantity. Special wholesale rates and GST invoice are prepared upon fulfillment.
            </p>
          </div>

          {/* Shop Selector Dropdown */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white w-full md:w-auto min-w-[280px]">
            <label className="text-xs font-semibold uppercase tracking-wider text-purple-200 block mb-1.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Fulfilling Branch / Shop
            </label>
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="w-full bg-white text-gray-900 font-semibold text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-white border-0 cursor-pointer shadow-sm"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.code ? `(${loc.code})` : ""}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-purple-200 mt-1">
              Fulfilling branch for this wholesale booking
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <Input
              type="text"
              placeholder="Search by size, model, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>

          {/* Brand Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                  selectedBrand === b
                    ? "bg-[#522874] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {b === "ALL" ? "All Brands" : b}
              </button>
            ))}
          </div>

          {/* Cart Drawer Trigger Button */}
          <Button
            onClick={() => setIsCartOpen(true)}
            className="w-full md:w-auto bg-[#522874] hover:bg-[#432060] text-white flex items-center justify-center gap-2 px-5 relative shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Review Order</span>
            {totalCartItems > 0 && (
              <span className="ml-1 bg-yellow-400 text-purple-950 font-bold text-xs px-2 py-0.5 rounded-full">
                {totalCartItems}
              </span>
            )}
          </Button>
        </div>

        {/* Live Tyre Grid (NO PRICES SHOWN) */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No Tyres Found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              No tyres match your current search and brand filters. Try clearing your search query or selecting a different brand.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const cartItem = cart[product.id];
              const cartQty = cartItem?.quantity || 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Brand Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#522874] bg-purple-50 px-2.5 py-1 rounded-md">
                        {product.brand || "Apollo"}
                      </span>
                    </div>

                    {/* Tyre Model & Size */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[#522874] transition-colors">
                        {product.modelName}
                      </h3>
                      <p className="text-sm font-semibold text-gray-600 mt-1">
                        Size: <span className="text-gray-900">{product.size}</span>
                      </p>
                    </div>

                    {/* Meta tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {product.tubeType && (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {product.tubeType}
                        </span>
                      )}
                      {product.category && (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {product.category.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Add Button */}
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    {cartQty > 0 ? (
                      <div className="flex items-center justify-between bg-purple-50 p-1.5 rounded-xl border border-purple-200">
                        <button
                          onClick={() => updateCartQuantity(product.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white text-[#522874] flex items-center justify-center font-bold shadow-sm hover:bg-purple-100 transition-colors"
                          title="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={cartQty}
                            onChange={(e) => setCartItemQuantity(product.id, e.target.value)}
                            className="w-14 text-center font-extrabold text-[#522874] text-sm bg-transparent border-0 focus:ring-1 focus:ring-[#522874] rounded p-0"
                          />
                          <span className="text-xs font-semibold text-purple-700">Booked</span>
                        </div>
                        <button
                          onClick={() => updateCartQuantity(product.id, 1)}
                          className="w-8 h-8 rounded-lg bg-white text-[#522874] flex items-center justify-center font-bold shadow-sm hover:bg-purple-100 transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(product, 1)}
                        className="w-full bg-[#522874] hover:bg-[#432060] text-white flex items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Booking
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#522874] text-white rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Your Tyre Booking</h2>
                    <p className="text-xs text-gray-500">
                      Shop: <span className="font-semibold text-gray-700">{currentShop?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {Object.keys(cart).length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="text-sm font-semibold text-gray-600">Your cart is empty.</p>
                    <p className="text-xs text-gray-400">
                      Select tyres from the catalogue to add them to your wholesale booking.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {Object.values(cart).map(({ product, quantity }) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200/60"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#522874]">
                              {product.brand}
                            </span>
                            <h4 className="font-bold text-gray-900 text-sm">{product.modelName}</h4>
                            <p className="text-xs text-gray-500 font-medium">Size: {product.size}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                              <button
                                onClick={() => updateCartQuantity(product.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setCartItemQuantity(product.id, e.target.value)}
                                className="w-12 text-center font-bold text-xs text-gray-900 border-0 focus:ring-1 focus:ring-[#522874] rounded py-1 px-0"
                              />
                              <button
                                onClick={() => updateCartQuantity(product.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Notes / Remarks */}
                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">
                        Order Notes / Preferred Delivery Date (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Urgent requirement for truck fleet, preferred delivery schedule..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none"
                      />
                    </div>

                    {/* Pricing Disclosure Notice */}
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        <span className="font-bold">Transparent Wholesale Workflow:</span> You can order any quantity for any tyre in the catalogue. Rates and applicable dealer discounts are finalized during billing by the shopkeeper. No upfront deposit is required to place your booking.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              {Object.keys(cart).length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/70 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Total Tyres Requested</span>
                    <span className="text-lg font-extrabold text-[#522874]">{totalCartItems} Units</span>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full bg-[#522874] hover:bg-[#432060] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Booking...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Wholesale Booking</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-purple-100">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-50 text-[#522874] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">
                Complete Dealer Profile
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Please enter your 10-digit mobile number. We will use this number to link your dealer account and send WhatsApp / SMS order updates.
              </p>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Mobile Number
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2.5 rounded-l-xl text-sm font-semibold text-gray-600">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none text-sm font-semibold tracking-wider"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSavingPhone || phoneInput.length < 10}
                className="w-full bg-[#522874] hover:bg-[#432060] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSavingPhone ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Proceed to Catalogue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

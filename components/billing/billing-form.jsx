"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Trash2, Loader2, User, Truck, Receipt } from "lucide-react";

export default function BillingForm({ inventory, locationId, userId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- CUSTOMER HEADER STATE ---
  const [customer, setCustomer] = useState({
    b2b: false,
    name: "",
    phone: "",
    address: "", // Kept address as it's useful, removed vehicle/gstin
    paymentMode: "Cash",
  });

  // --- CART STATE ---
  const [cart, setCart] = useState([]);

  // --- MANUAL FINANCIALS ---
  const [discount, setDiscount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);

  // --- ADD ITEM TO CART ---
  const addItem = () => {
    setCart([...cart, { inventoryId: "", quantity: 1, unitPrice: "" }]);
  };

  // --- UPDATE/REMOVE CART ITEM ---
  const updateItem = (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = value;
    setCart(newCart);
  };
  const removeItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // --- LIVE MATH CALCULATIONS ---
  const totals = useMemo(() => {
    let rawItemsTotal = 0;
    cart.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      rawItemsTotal += (qty * price);
    });

    // Apply manual inputs
    const discountAmount = Number(discount) || 0;
    const cgstAmount = Number(cgst) || 0;
    const sgstAmount = Number(sgst) || 0;

    const subtotal = Math.max(0, rawItemsTotal - discountAmount); // Taxable value after discount
    const totalGst = cgstAmount + sgstAmount;
    const grandTotal = subtotal + totalGst;

    return { rawItemsTotal, discountAmount, subtotal, totalGst, grandTotal, cgstAmount, sgstAmount };
  }, [cart, discount, cgst, sgst]);

  // --- SUBMIT INVOICE ---
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (cart.length === 0) return toast.error("Cart is empty!");

    const formattedItems = cart.map(item => {
      const invRecord = inventory.find(i => i.id === item.inventoryId);
      if (!invRecord) throw new Error("Invalid tyre selected");
      
      const qty = Number(item.quantity);
      if (qty > invRecord.quantity) throw new Error(`Only ${invRecord.quantity} left for ${invRecord.product.modelName}`);

      return {
        productId: invRecord.productId,
        modelName: invRecord.product.modelName,
        quantity: qty,
        unitPrice: Number(item.unitPrice),
        totalPrice: qty * Number(item.unitPrice),
      };
    });

    setLoading(true);
    const loadingToast = toast.loading("Generating Bill...");

    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo: customer,
          items: formattedItems,
          locationId,
          userId,
          totals
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Invoice Generated!", { id: loadingToast });
      
      // REDIRECT TO RECEIPT PAGE
      router.push(`/billing/receipt/${data.invoiceId}`);

    } catch (error) {
      toast.error(error.message, { id: loadingToast });
      setLoading(false);
    } 
  };

  return (
    <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Customer & Cart */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* --- CUSTOMER INFO SECTION --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-[#522874]" /> Customer Details
            </h2>
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className={!customer.b2b ? "text-[#522874]" : "text-gray-400"}>B2C (Retail)</span>
              <button 
                type="button"
                onClick={() => setCustomer({...customer, b2b: !customer.b2b})}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${customer.b2b ? 'bg-[#522874]' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${customer.b2b ? 'translate-x-6' : ''}`} />
              </button>
              <span className={customer.b2b ? "text-[#522874]" : "text-gray-400"}>B2B (Dealer)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer / Dealer Name</label>
              <input required value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#522874] outline-none" placeholder="e.g. Unnati Traders" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
              <input type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#522874] outline-none" placeholder="9876543210" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address / Notes</label>
              <input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#522874] outline-none" placeholder="Optional..." />
            </div>
          </div>
        </div>

        {/* --- CART SECTION --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#522874]" /> Material / Items
            </h2>
            <button type="button" onClick={addItem} className="text-sm bg-purple-50 text-[#522874] px-3 py-1.5 rounded-md font-bold hover:bg-purple-100 flex items-center gap-1 transition-colors">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {cart.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium">
                No items added to the bill yet.
              </div>
            )}

            {cart.map((item, index) => {
              const selectedInv = inventory.find(i => i.id === item.inventoryId);
              const maxStock = selectedInv ? selectedInv.quantity : 0;
              const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

              return (
                <div key={index} className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex-grow min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Tyre</label>
                    <select required value={item.inventoryId} onChange={(e) => updateItem(index, "inventoryId", e.target.value)} className="w-full px-3 py-2 border bg-white rounded-lg focus:ring-2 focus:ring-[#522874] outline-none">
                      <option value="">-- Choose Material --</option>
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.product.modelName} ({inv.product.size}) - Stock: {inv.quantity}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qty <span className="text-purple-600">({maxStock} max)</span></label>
                    <input required type="number" min="1" max={maxStock || 1} value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#522874] outline-none" />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit Price</label>
                    <input required type="number" min="1" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#522874] outline-none" placeholder="₹0.00" />
                  </div>
                  <div className="w-28 bg-white border border-gray-200 px-3 py-2 rounded-lg text-right font-bold text-gray-700">
                    ₹{lineTotal.toLocaleString()}
                  </div>
                  <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Invoice Summary */}
      <div className="space-y-6">
        <div className="bg-[#3d1d56] text-white p-6 rounded-xl shadow-lg sticky top-24">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-white/20 pb-4">
            <Receipt className="w-5 h-5 text-purple-300" /> Invoice Summary
          </h2>

          <div className="space-y-4 mb-6 text-sm font-medium">
            <div className="flex justify-between text-white/80">
              <span>Items Total</span>
              <span>₹{totals.rawItemsTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>

            {/* MANUAL FINANCIAL INPUTS */}
            <div className="flex justify-between items-center">
              <span className="text-white/80">Discount (₹)</span>
              <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-right outline-none focus:border-purple-300" placeholder="0" />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="font-bold text-white">Taxable Value</span>
              <span className="font-bold">₹{totals.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/80">CGST (₹)</span>
              <input type="number" min="0" value={cgst} onChange={e => setCgst(e.target.value)} className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-right outline-none focus:border-purple-300" placeholder="0" />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/80">SGST (₹)</span>
              <input type="number" min="0" value={sgst} onChange={e => setSgst(e.target.value)} className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-right outline-none focus:border-purple-300" placeholder="0" />
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 mb-6">
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold text-white">Grand Total</span>
              <span className="text-3xl font-black text-green-400">
                ₹{totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-purple-200 uppercase mb-2">Payment Mode</label>
            <select
              value={customer.paymentMode}
              onChange={(e) => setCustomer({...customer, paymentMode: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white outline-none cursor-pointer"
            >
              <option className="text-black" value="Cash">Cash</option>
              <option className="text-black" value="UPI">UPI</option>
              <option className="text-black" value="Card">Credit/Debit Card</option>
              <option className="text-black" value="Credit">Store Credit</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-lg font-black text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
            Generate Bill
          </button>
        </div>
      </div>

    </form>
  );
}
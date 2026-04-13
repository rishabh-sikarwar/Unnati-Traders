"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  Loader2,
  IndianRupee,
  HandCoins,
  X,
  ArchiveX,
  AlertCircle,
} from "lucide-react";

export default function CustomerLedger({ customers, userId }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDuesOnly, setFilterDuesOnly] = useState(false);

  // --- MODAL STATES ---
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    customer: null,
  });
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("CASH");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: Archive Modal State
  const [archiveModal, setArchiveModal] = useState({
    isOpen: false,
    customerId: null,
    customerName: "",
  });
  const [isArchiving, setIsArchiving] = useState(false);

  // --- FILTER LOGIC ---
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery));
    const matchesDues = filterDuesOnly ? c.outstandingDues > 0 : true;
    return matchesSearch && matchesDues;
  });

  // --- HANDLE PAYMENT ---
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0)
      return toast.error("Enter a valid amount");
    if (Number(payAmount) > paymentModal.customer.outstandingDues) {
      return toast.error("Amount exceeds outstanding dues!");
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Processing payment...");

    try {
      const res = await fetch("/api/customers/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: paymentModal.customer.id,
          amount: Number(payAmount),
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

  // --- EXECUTE ARCHIVE ---
  const executeArchive = async () => {
    setIsArchiving(true);
    const toastId = toast.loading("Archiving account...");

    try {
      const res = await fetch("/api/customers/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: archiveModal.customerId }),
      });

      if (!res.ok) throw new Error("Failed to archive");

      toast.success(`${archiveModal.customerName} archived successfully.`, {
        id: toastId,
      });
      setArchiveModal({ isOpen: false, customerId: null, customerName: "" });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Name or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterDuesOnly(!filterDuesOnly)}
            className={`px-4 py-2 rounded-lg font-bold border transition-all cursor-pointer active:scale-95 ${filterDuesOnly ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
          >
            {filterDuesOnly ? "Showing Dues Only" : "Filter: Has Dues"}
          </button>
        </div>
      </div>

      {/* DATA TABLE / CARDS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Customer Info
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Total Billed
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Total Paid
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Outstanding Dues
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {filteredCustomers.length === 0 && (
              <tr className="block md:table-row">
                <td
                  colSpan="5"
                  className="block md:table-cell p-8 text-center text-gray-500 border-b"
                >
                  No active customers found.
                </td>
              </tr>
            )}

            {filteredCustomers.map((c) => (
              <tr
                key={c.id}
                className="block md:table-row border-b border-gray-100 hover:bg-purple-50/10 transition-colors p-4 md:p-0"
              >
                {/* Info */}
                <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                  <div className="font-bold text-gray-900 text-lg md:text-base">
                    {c.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.phone || "No Phone"} •{" "}
                    <span className="uppercase text-[#522874] font-semibold">
                      {c.type.replace("_", " ")}
                    </span>
                  </div>
                </td>

                {/* Total Billed */}
                <td className="block md:table-cell md:p-4 md:text-right mb-2 md:mb-0">
                  <div className="flex justify-between md:justify-end items-center">
                    <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                      Total Billed:
                    </span>
                    <span className="font-bold text-gray-700">
                      ₹{c.totalBilled.toLocaleString()}
                    </span>
                  </div>
                </td>

                {/* Total Paid */}
                <td className="block md:table-cell md:p-4 md:text-right mb-2 md:mb-0">
                  <div className="flex justify-between md:justify-end items-center">
                    <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                      Total Paid:
                    </span>
                    <span className="font-bold text-green-600">
                      ₹{c.totalPaid.toLocaleString()}
                    </span>
                  </div>
                </td>

                {/* Outstanding Dues */}
                <td className="block md:table-cell md:p-4 md:text-right mb-4 md:mb-0">
                  <div className="flex justify-between md:justify-end items-center bg-red-50/50 p-2 md:p-0 rounded-lg">
                    <span className="md:hidden text-xs font-bold text-red-400 uppercase">
                      Outstanding Dues:
                    </span>
                    <span
                      className={`font-black text-lg ${c.outstandingDues > 0 ? "text-red-600" : "text-gray-400"}`}
                    >
                      ₹{c.outstandingDues.toLocaleString()}
                    </span>
                  </div>
                </td>

                {/* DYNAMIC ACTIONS */}
                <td className="block md:table-cell md:p-4 md:text-right border-t md:border-none pt-4 md:pt-0">
                  {c.outstandingDues > 0 ? (
                    // IF THEY OWE MONEY: Show Settle Dues button
                    <button
                      onClick={() => {
                        setPayAmount(c.outstandingDues);
                        setPaymentModal({ isOpen: true, customer: c });
                      }}
                      className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-[#522874] hover:bg-[#3d1d56] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 cursor-pointer"
                    >
                      <HandCoins className="w-4 h-4" /> Settle Dues
                    </button>
                  ) : (
                    // IF SETTLED: Show Archive Trigger
                    <button
                      onClick={() =>
                        setArchiveModal({
                          isOpen: true,
                          customerId: c.id,
                          customerName: c.name,
                        })
                      }
                      className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 cursor-pointer"
                    >
                      <ArchiveX className="w-4 h-4" />
                      Archive Account
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                    ₹{paymentModal.customer.outstandingDues.toLocaleString()}
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
                    min="1"
                    max={paymentModal.customer.outstandingDues}
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
    </div>
  );
}

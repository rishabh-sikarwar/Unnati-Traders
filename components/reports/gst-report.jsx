"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Loader2, CalendarDays, IndianRupee, PieChart } from "lucide-react";

export default function GstReport() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  
  // Default to current month and year
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/gst?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvoices(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data whenever month/year changes
  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  // Calculate Summaries
  const summary = useMemo(() => {
    let b2bSales = 0;
    let b2cSales = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    invoices.forEach(inv => {
      if (inv.customer?.type === "SUB_DEALER" || inv.customer?.type === "DISTRIBUTOR") {
        b2bSales += inv.grandTotal;
      } else {
        b2cSales += inv.grandTotal;
      }
      totalTaxable += inv.subtotal;
      totalCgst += (inv.totalGst / 2); // Split GST equally
      totalSgst += (inv.totalGst / 2);
    });

    return {
      b2bSales, b2cSales, totalTaxable, totalCgst, totalSgst,
      grandTotal: b2bSales + b2cSales,
      totalInvoices: invoices.length
    };
  }, [invoices]);

  // Handle Excel Download
  const downloadExcel = () => {
    if (invoices.length === 0) return toast.error("No data to export for this month.");

    // 1. Format the data exactly how a CA wants to see it
    const excelData = invoices.map((inv) => ({
      "Invoice Date": format(new Date(inv.createdAt), "dd-MMM-yyyy"),
      "Invoice Number": inv.invoiceNumber,
      "Customer Name": inv.customer?.name || "Walk-in Customer",
      "Customer Phone": inv.customer?.phone || "",
      "Sale Type": inv.customer?.type === "RETAIL" ? "B2C (Retail)" : "B2B (Dealer)",
      "Billed From (Shop)": inv.location?.name || "Unknown",
      "Payment Mode": inv.paymentMode,
      "Taxable Value (₹)": Number(inv.subtotal.toFixed(2)),
      "CGST (₹)": Number((inv.totalGst / 2).toFixed(2)),
      "SGST (₹)": Number((inv.totalGst / 2).toFixed(2)),
      "Total GST (₹)": Number(inv.totalGst.toFixed(2)),
      "Grand Total (₹)": Number(inv.grandTotal.toFixed(2)),
    }));

    // 2. Create the Worksheet and Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GST Report");

    // 3. Trigger Download
    const monthName = format(new Date(selectedYear, selectedMonth - 1), "MMMM-yyyy");
    XLSX.writeFile(workbook, `Unnati_GST_Report_${monthName}.xlsx`);
    toast.success("Excel File Downloaded!");
  };

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      
      {/* TOOLBAR */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <CalendarDays className="w-5 h-5 text-[#522874]" />
          <select 
            value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-gray-700 bg-gray-50"
          >
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-gray-700 bg-gray-50"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        <button 
          onClick={downloadExcel} disabled={loading || invoices.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
        >
          <FileSpreadsheet className="w-5 h-5" /> Download Excel for CA
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#522874]" /></div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[#522874]">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Invoices</p>
              <h3 className="text-2xl font-black text-gray-800">{summary.totalInvoices}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Taxable Value</p>
              <h3 className="text-2xl font-black text-gray-800">₹{summary.totalTaxable.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-orange-400">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Collected GST</p>
              <h3 className="text-2xl font-black text-gray-800">₹{(summary.totalCgst + summary.totalSgst).toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Grand Total Revenue</p>
              <h3 className="text-2xl font-black text-gray-800">₹{summary.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
          </div>

          {/* B2B vs B2C BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-purple-900 flex items-center gap-2"><PieChart className="w-5 h-5"/> B2B (Dealers) Revenue</h4>
                <p className="text-sm text-purple-700 mt-1">Wholesale transactions</p>
              </div>
              <span className="text-2xl font-black text-[#522874]">₹{summary.b2bSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-blue-900 flex items-center gap-2"><IndianRupee className="w-5 h-5"/> B2C (Retail) Revenue</h4>
                <p className="text-sm text-blue-700 mt-1">Direct walk-in customers</p>
              </div>
              <span className="text-2xl font-black text-blue-700">₹{summary.b2cSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
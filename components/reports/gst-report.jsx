"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Loader2,
  CalendarDays,
  IndianRupee,
  PieChart,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { formatNumber } from "@/lib/format";

export default function GstReport() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);

  // Default time controls
  const currentDate = new Date();
  const [period, setPeriod] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [periodMeta, setPeriodMeta] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ period });

      if (period === "monthly") {
        query.set("month", String(selectedMonth));
        query.set("year", String(selectedYear));
      }

      if (period === "custom") {
        if (!customStart || !customEnd) {
          setLoading(false);
          return toast.error("Please select both start and end dates.");
        }
        query.set("start", customStart);
        query.set("end", customEnd);
      }

      const res = await fetch(`/api/reports/gst?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvoices(data.invoices || []);
      setPurchases(data.purchases || []);
      setPeriodMeta(data.period || null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever filters change.
  useEffect(() => {
    fetchReport();
  }, [period, selectedMonth, selectedYear, customStart, customEnd]);

  // Calculate Summaries
  const summary = useMemo(() => {
    let b2bSales = 0;
    let b2cSales = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    invoices.forEach((inv) => {
      if (
        inv.customer?.type === "SUB_DEALER" ||
        inv.customer?.type === "DISTRIBUTOR"
      ) {
        b2bSales += inv.grandTotal;
      } else {
        b2cSales += inv.grandTotal;
      }
      totalTaxable += inv.subtotal;
      totalCgst += inv.totalGst / 2; // Split GST equally
      totalSgst += inv.totalGst / 2;
    });

    const totalPurchaseValue = purchases.reduce(
      (sum, purchase) => sum + (Number(purchase.totalAmount) || 0),
      0,
    );

    const grandTotal = b2bSales + b2cSales;

    return {
      b2bSales,
      b2cSales,
      totalTaxable,
      totalCgst,
      totalSgst,
      grandTotal,
      totalInvoices: invoices.length,
      totalPurchases: purchases.length,
      totalPurchaseValue,
      netRevenueAfterPurchase: grandTotal - totalPurchaseValue,
    };
  }, [invoices, purchases]);

  const displayRangeLabel = useMemo(() => {
    if (period === "monthly") {
      return format(new Date(selectedYear, selectedMonth - 1, 1), "MMMM yyyy");
    }
    if (period === "last_3_months") return "Last 3 Months";
    if (period === "last_1_year") return "Last 1 Year";
    if (period === "custom" && customStart && customEnd) {
      return `${format(new Date(customStart), "dd MMM yyyy")} to ${format(new Date(customEnd), "dd MMM yyyy")}`;
    }
    return periodMeta?.label || "Selected Range";
  }, [period, selectedMonth, selectedYear, customStart, customEnd, periodMeta]);

  // Handle Excel Download
  const downloadExcel = () => {
    if (invoices.length === 0 && purchases.length === 0) {
      return toast.error("No report data to export for this timeframe.");
    }

    // Sales statement sheet
    const salesExcelData = invoices.map((inv) => ({
      "Invoice Date": format(new Date(inv.createdAt), "dd-MMM-yyyy"),
      "Invoice Number": inv.invoiceNumber,
      "Customer Name": inv.customer?.name || "Walk-in Customer",
      "Customer Phone": inv.customer?.phone || "",
      "Sale Type":
        inv.customer?.type === "RETAIL" ? "B2C (Retail)" : "B2B (Dealer)",
      "Billed From (Shop)": inv.location?.name || "Unknown",
      "Payment Mode": inv.paymentMode,
      "Taxable Value (₹)": Number(inv.subtotal.toFixed(2)),
      "CGST (₹)": Number((inv.totalGst / 2).toFixed(2)),
      "SGST (₹)": Number((inv.totalGst / 2).toFixed(2)),
      "Total GST (₹)": Number(inv.totalGst.toFixed(2)),
      "Grand Total (₹)": Number(inv.grandTotal.toFixed(2)),
    }));

    // Purchase statement sheet
    const purchaseExcelData = purchases.map((purchase) => ({
      "Purchase Date": format(new Date(purchase.purchaseDate), "dd-MMM-yyyy"),
      "Apollo Invoice Number": purchase.invoiceNumber,
      Supplier: purchase.supplierName || "Apollo Tyres",
      "Purchased For (Shop)": purchase.location?.name || "Unknown",
      "Purchase Amount (₹)": Number((purchase.totalAmount || 0).toFixed(2)),
      Status: purchase.status,
    }));

    // Summary sheet for CA quick review
    const summarySheetData = [
      { Metric: "Report Range", Value: displayRangeLabel },
      { Metric: "Total Sales Invoices", Value: summary.totalInvoices },
      {
        Metric: "Total Sales Amount (₹)",
        Value: Number(summary.grandTotal.toFixed(2)),
      },
      { Metric: "Total Purchases", Value: summary.totalPurchases },
      {
        Metric: "Total Purchase Value (₹)",
        Value: Number(summary.totalPurchaseValue.toFixed(2)),
      },
      {
        Metric: "Net Revenue After Purchases (₹)",
        Value: Number(summary.netRevenueAfterPurchase.toFixed(2)),
      },
      {
        Metric: "Taxable Sales Value (₹)",
        Value: Number(summary.totalTaxable.toFixed(2)),
      },
      {
        Metric: "Total Collected GST (₹)",
        Value: Number((summary.totalCgst + summary.totalSgst).toFixed(2)),
      },
    ];

    // Build workbook
    const summaryWorksheet = XLSX.utils.json_to_sheet(summarySheetData);
    const salesWorksheet = XLSX.utils.json_to_sheet(salesExcelData);
    const purchaseWorksheet = XLSX.utils.json_to_sheet(purchaseExcelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, salesWorksheet, "Sales Statement");
    XLSX.utils.book_append_sheet(
      workbook,
      purchaseWorksheet,
      "Purchase Statement",
    );

    const safeRangeLabel = displayRangeLabel.replace(/[^a-zA-Z0-9]+/g, "_");
    XLSX.writeFile(
      workbook,
      `Unnati_Sales_Purchase_Report_${safeRangeLabel}.xlsx`,
    );
    toast.success("Excel File Downloaded!");
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <CalendarDays className="w-5 h-5 text-[#522874]" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-gray-700 bg-gray-50"
          >
            <option value="monthly">Monthly</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_1_year">Last 1 Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {period === "monthly" && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-gray-700 bg-gray-50"
              >
                {months.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-gray-700 bg-gray-50"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </>
          )}

          {period === "custom" && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-medium text-gray-700 bg-gray-50"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-medium text-gray-700 bg-gray-50"
              />
            </>
          )}
        </div>

        <button
          onClick={downloadExcel}
          disabled={
            loading || (invoices.length === 0 && purchases.length === 0)
          }
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
        >
          <FileSpreadsheet className="w-5 h-5" /> Download Sales + Purchase
          Excel
        </button>
      </div>

      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 text-sm font-semibold">
        Reporting Window:{" "}
        <span className="text-green-300">{displayRangeLabel}</span>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#522874]" />
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[#522874]">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                Total Sales Invoices
              </p>
              <h3 className="text-2xl font-black text-gray-800">
                {summary.totalInvoices}
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                Taxable Value
              </p>
              <h3 className="text-2xl font-black text-gray-800">
                {`₹${formatNumber(summary.totalTaxable, 2)}`}
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-orange-400">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                Total Collected GST
              </p>
              <h3 className="text-2xl font-black text-gray-800">
                {`₹${formatNumber(summary.totalCgst + summary.totalSgst, 2)}`}
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                Grand Total Revenue
              </p>
              <h3 className="text-2xl font-black text-gray-800">
                {`₹${formatNumber(summary.grandTotal, 2)}`}
              </h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-rose-500">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                Total Purchases
              </p>
              <h3 className="text-2xl font-black text-gray-800">
                {`₹${formatNumber(summary.totalPurchaseValue, 2)}`}
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                {summary.totalPurchases} purchase entries
              </p>
            </div>
          </div>

          {/* B2B vs B2C BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-purple-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5" /> B2B (Dealers) Revenue
                </h4>
                <p className="text-sm text-purple-700 mt-1">
                  Wholesale transactions
                </p>
              </div>
              <span className="text-2xl font-black text-[#522874]">
                {`₹${formatNumber(summary.b2bSales, 2)}`}
              </span>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" /> B2C (Retail) Revenue
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Direct walk-in customers
                </p>
              </div>
              <span className="text-2xl font-black text-blue-700">
                {`₹${formatNumber(summary.b2cSales, 2)}`}
              </span>
            </div>
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Net After Purchases
                </h4>
                <p className="text-sm text-emerald-700 mt-1">
                  Revenue minus purchase value
                </p>
              </div>
              <span className="text-2xl font-black text-emerald-700">
                {`₹${formatNumber(summary.netRevenueAfterPurchase, 2)}`}
              </span>
            </div>
          </div>

          {/* Purchase Statement Preview */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" /> Purchase
                Statement ({summary.totalPurchases})
              </h3>
              <span className="text-sm font-bold text-gray-500">
                Total: ₹{`₹${formatNumber(summary.totalPurchaseValue, 2)}`}
              </span>
            </div>

            {purchases.length === 0 ? (
              <p className="text-sm text-gray-500">
                No purchases found for the selected timeframe.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Apollo Invoice</th>
                      <th className="py-2 pr-3">Shop</th>
                      <th className="py-2 pr-3">Supplier</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.slice(0, 10).map((purchase) => (
                      <tr
                        key={purchase.id}
                        className="border-b border-gray-100 text-sm"
                      >
                        <td className="py-2 pr-3 text-gray-700">
                          {format(
                            new Date(purchase.purchaseDate),
                            "dd MMM yyyy",
                          )}
                        </td>
                        <td className="py-2 pr-3 font-semibold text-gray-800">
                          {purchase.invoiceNumber}
                        </td>
                        <td className="py-2 pr-3 text-gray-600">
                          {purchase.location?.name || "Unknown"}
                        </td>
                        <td className="py-2 pr-3 text-gray-600">
                          {purchase.supplierName || "Apollo Tyres"}
                        </td>
                        <td className="py-2 text-right font-black text-gray-900">
                          {`₹${formatNumber(Number(purchase.totalAmount || 0), 2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {purchases.length > 10 && (
                  <p className="text-xs text-gray-500 mt-3 font-medium">
                    Showing 10 of {purchases.length} purchases. Download Excel
                    for complete purchase statement.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

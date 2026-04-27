import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }) {
  const { id } = await params;
  const { userId } = await auth();

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      location: true,
      payments: {
        select: {
          amount: true,
          paymentMode: true,
        },
      },
      items: {
        include: { product: true },
      },
    },
  });

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <p className="text-5xl mb-4">🧾</p>
          <h1 className="text-2xl font-black text-gray-800 mb-2">
            Invoice Not Found
          </h1>
          <p className="text-gray-500 text-sm">
            This receipt link is invalid or the invoice has been removed.
          </p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(invoice.createdAt).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );

  // --- GST LOGIC (MP State Code is 23) ---
  // If GST number exists and DOES NOT start with 23, it is IGST. Otherwise, CGST + SGST.
  const hasGst = Boolean(invoice.customer?.gstNumber);
  const isIgst = hasGst && !invoice.customer.gstNumber.startsWith("23");

  const cgstSgstAmount = isIgst ? 0 : invoice.totalGst / 2;
  const igstAmount = isIgst ? invoice.totalGst : 0;

  // Prefer invoice-level split amounts; fallback to payment logs for older records.
  const paymentLogs = Array.isArray(invoice.payments) ? invoice.payments : [];
  const logCash = paymentLogs
    .filter((p) => p.paymentMode === "CASH")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const logUpi = paymentLogs
    .filter((p) => p.paymentMode === "UPI")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const logCard = paymentLogs
    .filter((p) => p.paymentMode === "CARD")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const cashAmount =
    (Number(invoice.splitCash) || 0) > 0
      ? Number(invoice.splitCash) || 0
      : logCash;
  const upiAmount =
    (Number(invoice.splitUpi) || 0) > 0
      ? Number(invoice.splitUpi) || 0
      : logUpi;
  const cardAmount =
    (Number(invoice.splitCard) || 0) > 0
      ? Number(invoice.splitCard) || 0
      : logCard;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: A4; margin: 10mm; }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          
          /* Hide action bar */
          #action-bar { 
            display: none !important; 
          }

          /* Remove wrapper styles that affect printing */
          #receipt-wrapper { 
            padding: 0 !important; 
            margin: 0 !important;
            background: transparent !important; 
            min-height: 0 !important;
            display: block !important;
          }

          /* Reset canvas styles for pristine printing */
          #invoice-canvas {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
        }
      `,
        }}
      />

      {/* Main content wrapper */}
      <div
        id="receipt-wrapper"
        className="bg-gray-200 min-h-screen flex flex-col items-center"
        style={{
          paddingTop: "100px",
          paddingBottom: "40px",
          paddingLeft: "16px",
          paddingRight: "16px",
        }}
      >
        {/* Action bar — normal document flow, centered above invoice */}
        <div
          id="action-bar"
          className="w-full max-w-[210mm] flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
        >
          {userId ? (
            <Link
              href="/billing"
              className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 hover:text-gray-900 font-bold bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-sm whitespace-nowrap w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" /> Back to Billing
            </Link>
          ) : (
            <div className="hidden sm:block"></div>
          )}
          <div className="w-full sm:w-auto mt-4 sm:mt-0">
            <PrintButton />
          </div>
        </div>

        {/* The Printable A4 Canvas */}
        <div className="w-full max-w-[210mm] flex justify-center">
          <div
            id="invoice-canvas"
            className="bg-white w-full p-8 rounded-lg shadow-xl animate-in fade-in duration-500 text-gray-900"
          >
            {/* --- HEADER --- */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
              <div className="space-y-1 text-sm">
                <h1 className="text-3xl font-black text-[#522874] tracking-tighter leading-none mb-2">
                  UNNATI TRADERS
                </h1>
                <p>
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Shop:
                  </span>{" "}
                  <span className="font-bold text-gray-800">
                    {invoice.location?.name || "Unnati Traders"}
                  </span>
                </p>
                {invoice.location?.address && (
                  <p>
                    <span className="font-bold text-gray-500 uppercase text-xs">
                      Add:
                    </span>{" "}
                    {invoice.location.address}
                  </p>
                )}
                <p>
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    GSTIN:
                  </span>{" "}
                  <span className="font-black tracking-wide text-gray-800">
                    {"23ASOPC2921N2Z0"}
                  </span>
                </p>
                <p className="text-xs font-bold text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded border border-purple-100 mt-1">
                  AUTHORIZED APOLLO DISTRIBUTOR
                </p>
              </div>
              <div className="text-right space-y-1 text-sm">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-2">
                  Tax Invoice
                </h2>
                <p>
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Invoice No:
                  </span>{" "}
                  <span className="font-black">{invoice.invoiceNumber}</span>
                </p>
                <p>
                  <span className="font-bold text-gray-500 uppercase text-xs">
                    Date:
                  </span>{" "}
                  <span className="font-bold">{formattedDate}</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-2">
                  Issued under Rule 46 of CGST Rules
                </p>
              </div>
            </div>

            {/* --- BILL TO SECTION --- */}
            <div className="mb-6 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-1 text-sm">
                <h3 className="font-black text-gray-800 mb-1 uppercase text-xs tracking-widest border-b border-gray-200 pb-1">
                  Billed To:
                </h3>
                <p>
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase">
                    Customer:
                  </span>{" "}
                  <span className="font-black text-base ml-1">
                    {invoice.customer?.name}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-500 text-xs tracking-wider uppercase">
                    Phone:
                  </span>{" "}
                  <span className="ml-1">
                    {invoice.customer?.phone || "N/A"}
                  </span>
                </p>
                {invoice.customer?.address && (
                  <p>
                    <span className="font-bold text-gray-500 text-xs tracking-wider uppercase">
                      Address:
                    </span>{" "}
                    <span className="ml-1">{invoice.customer.address}</span>
                  </p>
                )}
                {invoice.customer?.gstNumber && (
                  <p className="mt-1">
                    <span className="font-bold text-gray-500 text-xs tracking-wider uppercase">
                      GSTIN:
                    </span>{" "}
                    <span className="font-black tracking-widest ml-1 text-[#522874]">
                      {invoice.customer.gstNumber}
                    </span>
                  </p>
                )}
              </div>
              <div className="text-right flex flex-col items-end justify-center gap-2">
                <p className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-1 rounded-md uppercase shadow-sm">
                  TYPE: {invoice.customer?.type.replace("_", " ")}
                </p>
                <p className="text-xs font-bold text-[#522874] bg-white border border-purple-200 px-3 py-1 rounded-md uppercase shadow-sm">
                  PAYMENT:{" "}
                  {invoice.paymentMode === "MULTIPLE"
                    ? "SPLIT"
                    : invoice.paymentMode}
                </p>
              </div>
            </div>

            {/* --- ITEMS TABLE (Ultra Compact for Print) --- */}
            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white text-[11px] uppercase tracking-wider">
                    <th className="py-2 px-2 font-bold w-10 text-center rounded-tl">
                      #
                    </th>
                    <th className="py-2 px-2 font-bold">
                      Item Description & Code
                    </th>
                    <th className="py-2 px-2 font-bold text-center w-16">
                      Qty
                    </th>
                    <th className="py-2 px-2 font-bold text-right w-24">
                      Rate (Inc. Tax)
                    </th>
                    <th className="py-2 px-2 font-bold text-right w-28 rounded-tr">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {invoice.items.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-4 text-center text-gray-400"
                      >
                        No items found for this invoice.
                      </td>
                    </tr>
                  )}
                  {invoice.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 group"
                    >
                      <td className="py-2 px-2 text-center align-top text-gray-500">
                        {index + 1}
                      </td>
                      <td className="py-2 px-2 align-top">
                        <div className="font-black text-gray-900 leading-tight">
                          {/* FIX: Safely fallback if product was deleted from DB */}
                          {item.product?.modelName || "Unknown/Deleted Tyre"}
                          {item.product?.size && (
                            <span className="text-[#522874] ml-1">
                              ({item.product.size})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-bold text-gray-700 bg-gray-100 px-1 rounded">
                            HSN: {item.product?.hsnCode || "4011"}
                          </span>
                          <span>SKU: {item.product?.sku || "N/A"}</span>
                          {item.tyreCode && (
                            <span className="font-bold text-gray-800 bg-gray-100 px-1 rounded">
                              SN: {item.tyreCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center align-top font-black">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-2 text-right align-top text-gray-700">
                        ₹
                        {item.unitPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 px-2 text-right align-top font-black">
                        ₹
                        {item.totalPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- FINANCIAL SUMMARY --- */}
            <div className="flex justify-between items-start border-t-2 border-gray-800 pt-4">
              {/* Left Side: Tax Breakdown */}
              <div className="w-1/2 text-xs pr-4">
                <p className="font-black text-gray-800 mb-2 uppercase tracking-wide border-b border-gray-100 pb-1">
                  Tax Breakdown Summary
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-gray-600">
                  <span>Taxable Amount:</span>{" "}
                  <span className="font-bold text-gray-800 text-right">
                    ₹
                    {invoice.subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  {/* Explicit CA-Level Breakdown */}
                  <span>CGST:</span>{" "}
                  <span className="font-bold text-gray-800 text-right">
                    ₹
                    {cgstSgstAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span>SGST:</span>{" "}
                  <span className="font-bold text-gray-800 text-right">
                    ₹
                    {cgstSgstAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span>IGST:</span>{" "}
                  <span className="font-bold text-gray-800 text-right">
                    ₹
                    {igstAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="pt-1 border-t border-gray-200">
                    Total Tax:
                  </span>
                  <span className="font-black text-gray-900 text-right pt-1 border-t border-gray-200">
                    ₹
                    {invoice.totalGst.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Right Side: Totals */}
              <div className="w-1/2 text-sm space-y-1.5">
                <div className="flex justify-between px-2">
                  <span className="text-gray-600 font-bold">Taxable Value</span>
                  <span className="font-black text-gray-800">
                    ₹
                    {invoice.subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between px-2 border-b border-gray-200 pb-2">
                  <span className="text-gray-600 font-bold">
                    Total GST (Inclusive)
                  </span>
                  <span className="font-black text-gray-800">
                    ₹
                    {invoice.totalGst.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between bg-gray-100 p-2 border border-gray-300 rounded">
                  <span className="font-black text-lg text-gray-900">
                    Grand Total
                  </span>
                  <span className="font-black text-lg text-[#522874]">
                    ₹
                    {invoice.grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Show Dues if applicable */}
                {(invoice.paymentMode === "CREDIT" ||
                  invoice.paymentMode === "MULTIPLE") && (
                  <div className="text-xs font-bold px-2 pt-2 text-gray-800 space-y-1.5">
                    <div className="flex justify-between">
                      <span>
                        Paid: ₹
                        {invoice.amountPaid.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-orange-600">
                        Due: ₹
                        {(
                          invoice.grandTotal - invoice.amountPaid
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {invoice.paymentMode === "MULTIPLE" && (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-semibold border border-gray-200 bg-gray-50 rounded p-2">
                        <span>Cash Received:</span>
                        <span className="text-right">
                          ₹
                          {cashAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span>UPI Received:</span>
                        <span className="text-right">
                          ₹
                          {upiAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span>Card Received:</span>
                        <span className="text-right">
                          ₹
                          {cardAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* --- FOOTER / SIGNATURE --- */}
            <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-end">
              <div className="text-[10px] text-gray-500 space-y-1">
                <p className="font-bold text-gray-800 uppercase tracking-wider text-xs mb-2">
                  Terms & Conditions:
                </p>
                <p>
                  1. Goods once sold will not be taken back without valid
                  reason.
                </p>
                <p>
                  2. Warranty claims are subject to Apollo Tyres official
                  policies.
                </p>
                <p>3. All disputes subject to Bhind Jurisdiction.</p>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-gray-400 h-10 mb-2"></div>
                <p className="font-black text-gray-800 text-xs">
                  For UNNATI TRADERS
                </p>
                <p className="text-[10px] text-gray-500">
                  Authorized Signatory
                </p>
              </div>
            </div>

            <div className="mt-6 text-[9px] text-gray-400 text-center uppercase tracking-widest">
              This is a computer-generated tax invoice.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

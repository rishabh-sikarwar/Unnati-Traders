"use client";

import dynamic from "next/dynamic";
import { Download, Printer } from "lucide-react";
import InvoicePDF from "@/components/billing/invoice-pdf-template";

// Dynamically import PDFDownloadLink to prevent SSR issues with Node streams
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        className="flex items-center justify-center gap-2 bg-gray-400 text-white px-5 py-2.5 rounded-xl font-bold border border-gray-400 text-sm whitespace-nowrap opacity-70 cursor-not-allowed"
      >
        <Download className="w-4 h-4" /> Loading PDF...
      </button>
    ),
  }
);

export default function PrintButton({ invoice }) {
  if (!invoice) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
      {/* Direct Browser Print Button */}
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 cursor-pointer border border-gray-300 text-sm whitespace-nowrap w-full sm:w-auto"
        title="Print Invoice directly to printer"
      >
        <Printer className="w-4 h-4 text-[#522874]" />
        <span>Print Invoice</span>
      </button>

      {/* React-PDF Download Button */}
      <PDFDownloadLink
        document={<InvoicePDF invoiceData={invoice} />}
        fileName={`Invoice_${invoice.invoiceNumber}.pdf`}
        className="flex items-center justify-center gap-2 bg-[#522874] hover:bg-[#3d1d56] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer border border-[#522874] text-sm whitespace-nowrap w-full sm:w-auto"
      >
        {({ blob, url, loading, error }) =>
          loading ? (
            <>
              <Download className="w-4 h-4 animate-bounce" /> Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Download PDF
            </>
          )
        }
      </PDFDownloadLink>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import InvoicePDF from "@/components/billing/invoice-pdf-template";

// Dynamically import PDFDownloadLink to prevent SSR issues with Node streams
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        className="flex items-center justify-center gap-2 bg-gray-400 text-white px-6 py-2.5 rounded-xl font-bold border border-gray-400 text-sm whitespace-nowrap w-full opacity-70 cursor-not-allowed"
      >
        <Download className="w-4 h-4" /> Loading PDF...
      </button>
    ),
  }
);

export default function PrintButton({ invoice }) {
  // We can still keep window.print() if desired, but we will wrap it or replace it.
  // The user asked to upgrade to use @react-pdf/renderer, we can just replace the print button with the download link,
  // or provide both. Let's provide a primary Download PDF button and a secondary Print Screen button if needed, 
  // or just replace it with Download PDF as requested.
  
  if (!invoice) return null;

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoiceData={invoice} />}
      fileName={`Invoice_${invoice.invoiceNumber}.pdf`}
      className="flex items-center justify-center gap-2 bg-[#522874] hover:bg-[#3d1d56] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer border border-[#522874] text-sm whitespace-nowrap w-full"
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
  );
}

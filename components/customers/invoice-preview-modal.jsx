"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

export default function InvoicePreviewModal({ invoiceId, invoiceNumber }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="font-bold text-gray-900 hover:text-[#522874] hover:underline inline-flex items-center gap-1"
        title={`Preview invoice ${invoiceNumber}`}
      >
        {`Invoice #${invoiceNumber}`}
        <ExternalLink className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full h-[92dvh] md:h-[90vh] md:max-w-6xl overflow-hidden rounded-t-2xl md:rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start md:items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 md:px-5 md:py-4">
              <div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">
                  Invoice Preview
                </p>
                <h3 className="text-base md:text-lg font-black text-gray-900 break-all">
                  Invoice #{invoiceNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 shrink-0"
              >
                <X className="h-4 w-4" /> Close
              </button>
            </div>

            <iframe
              title={`Invoice ${invoiceNumber}`}
              src={`/billing/receipt/${invoiceId}`}
              className="h-[calc(92dvh-57px)] md:h-[calc(90vh-73px)] w-full border-0 bg-white"
            />
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";

export default function ReceiptActions() {
  const [backLoading, setBackLoading] = useState(false);

  return (
    <div className="flex justify-between items-center print:hidden">
      <Link
        href="/billing"
        onClick={() => setBackLoading(true)}
        className="text-[#522874] font-bold flex items-center gap-2 hover:underline cursor-pointer active:scale-95 transition-transform"
      >
        {backLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowLeft className="w-4 h-4" />
        )}
        {backLoading ? "Loading..." : "Back to Billing"}
      </Link>
      <button
        onClick={() => window.print()}
        className="bg-[#522874] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#3d1d56] cursor-pointer active:scale-95 transition-all"
      >
        <Printer className="w-4 h-4" /> Print Invoice
      </button>
    </div>
  );
}

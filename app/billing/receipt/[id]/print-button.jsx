"use client";

import { Download } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center justify-center gap-2 bg-[#522874] hover:bg-[#3d1d56] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer border border-[#522874] text-sm whitespace-nowrap w-full"
    >
      <Download className="w-4 h-4" /> Download PDF / Print
    </button>
  );
}

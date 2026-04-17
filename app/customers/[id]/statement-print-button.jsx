"use client";

import { FileText } from "lucide-react";

export default function StatementPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-[#522874] text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-[#3d1d56] transition-colors cursor-pointer active:scale-95"
    >
      <FileText className="w-4 h-4" /> Print / Save PDF
    </button>
  );
}

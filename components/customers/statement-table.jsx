"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Pencil } from "lucide-react";
import { formatNumber } from "@/lib/format";
import InvoicePreviewModal from "@/components/customers/invoice-preview-modal";
import EditPaymentModal from "./edit-payment-modal";

export default function StatementTable({ statement, isAdmin }) {
  const router = useRouter();
  const [editingPayment, setEditingPayment] = useState(null);

  return (
    <div className="overflow-x-auto">
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={() => router.refresh()}
        />
      )}

      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-gray-100/50 print:bg-gray-100 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 print:text-gray-800">
            <th className="py-4 px-6 font-bold">Date</th>
            <th className="py-4 px-6 font-bold">Transaction Description</th>
            <th className="py-4 px-6 font-bold text-right text-red-600 print:text-gray-800">
              Debit (-)
            </th>
            <th className="py-4 px-6 font-bold text-right text-green-600 print:text-gray-800">
              Credit (+)
            </th>
            <th className="py-4 px-6 font-bold text-right text-[#522874] print:text-gray-800">
              Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {statement.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                className="py-12 text-center text-gray-400 font-medium"
              >
                No transactions recorded yet.
              </td>
            </tr>
          ) : (
            statement.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-purple-50/30 print:hover:bg-transparent transition-colors"
              >
                {/* Date */}
                <td className="py-4 px-6 text-sm text-gray-600 font-medium whitespace-nowrap">
                  <Calendar className="w-3 h-3 inline mr-1.5 opacity-50 print:hidden" />
                  {new Date(row.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>

                {/* Transaction Description */}
                <td className="py-4 px-6 text-sm">
                  {row.type === "BILL" ? (
                    <InvoicePreviewModal
                      invoiceId={row.invoiceId}
                      invoiceNumber={row.invoiceNumber}
                    />
                  ) : (
                    <div className="inline-flex items-center flex-wrap gap-1">
                      <span
                        className={`font-bold ${
                          row.type === "BILL" || row.type === "OPENING"
                            ? "text-gray-900"
                            : "text-green-700 print:text-gray-600"
                        }`}
                      >
                        {row.description}
                      </span>

                      {/* Display Edit button only for manual payments (NOT Return Credits, NOT Bills, NOT Invoice-linked payments) and ONLY for Admin */}
                      {row.type === "PAYMENT" && row.paymentMode !== "RETURN_CREDIT" && !row.invoiceId && isAdmin && (
                        <button
                          type="button"
                          onClick={() => setEditingPayment(row)}
                          className="inline-flex items-center justify-center p-1 text-gray-400 hover:text-[#522874] hover:bg-purple-50 rounded transition-all ml-1.5 print:hidden active:scale-90 cursor-pointer"
                          title="Edit Payment Amount"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </td>

                {/* Debit */}
                <td className="py-4 px-6 text-right text-sm font-bold text-red-500 print:text-gray-900">
                  {row.debit > 0 ? `₹${formatNumber(row.debit, 2)}` : "-"}
                </td>

                {/* Credit */}
                <td className="py-4 px-6 text-right text-sm font-bold text-green-600 print:text-gray-900">
                  {row.credit > 0 ? `₹${formatNumber(row.credit, 2)}` : "-"}
                </td>

                {/* Balance */}
                <td className="py-4 px-6 text-right text-sm font-black text-[#522874] print:text-gray-900">
                  {`₹${formatNumber(row.balance, 2)}`}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

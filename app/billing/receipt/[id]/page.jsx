import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      location: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!invoice) redirect("/billing");

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 pt-24">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Controls (Hidden during printing via Tailwind's print:hidden) */}
        <div className="flex justify-between items-center print:hidden">
          <Link
            href="/billing"
            className="text-[#522874] font-bold flex items-center gap-2 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Billing
          </Link>
          {/* Add a client component or vanilla JS onclick to print */}
          <button
            onClick="window.print()"
            className="bg-[#522874] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#3d1d56]"
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        </div>

        {/* The Printable A4 Canvas */}
        <div className="bg-white p-10 rounded-sm shadow-md print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#522874] tracking-tighter">
                UNNATI TRADERS
              </h1>
              <p className="text-gray-600 mt-1">
                {invoice.location?.address || "Gwalior, MP"}
              </p>
              <p className="text-gray-600">
                Issued under Rule 46 of CGST Rules
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">TAX INVOICE</h2>
              <p className="font-bold text-gray-600 mt-2">
                Invoice No: {invoice.invoiceNumber}
              </p>
              <p className="text-gray-600">
                Date: {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1">
              Bill To:
            </h3>
            <p className="font-bold text-lg">{invoice.customer?.name}</p>
            <p className="text-gray-600">{invoice.customer?.phone || "N/A"}</p>
            <p className="text-gray-600">{invoice.customer?.address || ""}</p>
            <p className="text-gray-600 mt-1 font-bold text-xs bg-gray-100 w-fit px-2 py-0.5 rounded">
              TYPE: {invoice.customer?.type}
            </p>
          </div>

          {/* Items Table */}
          <table className="w-full text-left mb-8 border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y-2 border-gray-800 text-sm">
                <th className="py-3 px-2 font-bold">S.No</th>
                <th className="py-3 px-2 font-bold">Material Description</th>
                <th className="py-3 px-2 font-bold text-center">Qty</th>
                <th className="py-3 px-2 font-bold text-right">Unit Price</th>
                <th className="py-3 px-2 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200 text-sm">
                  <td className="py-3 px-2">{index + 1}</td>
                  <td className="py-3 px-2 font-medium">
                    {item.product.modelName} ({item.product.size})
                  </td>
                  <td className="py-3 px-2 text-center">{item.quantity}</td>
                  <td className="py-3 px-2 text-right">
                    ₹
                    {item.unitPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-3 px-2 text-right font-bold">
                    ₹
                    {item.totalPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Summary */}
          <div className="flex justify-end">
            <div className="w-1/2 space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600">Taxable Value</span>
                <span className="font-bold">
                  ₹
                  {invoice.subtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-600">Total Tax (CGST + SGST)</span>
                <span className="font-bold">
                  ₹
                  {invoice.totalGst.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between bg-gray-100 p-2 border-y-2 border-gray-800 mt-2">
                <span className="font-bold text-lg">Grand Total</span>
                <span className="font-black text-lg">
                  ₹
                  {invoice.grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-16 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
            This is a computer-generated document. No signature is required.{" "}
            <br />
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import PrintButton from "./print-button";

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

  const formattedDate = new Date(invoice.createdAt).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8 pt-28 md:pt-36 pb-20 flex flex-col items-center">
      {/* Responsive Action Bar (Hidden when printing) */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden">
        <Link
          href="/billing"
          className="w-full sm:w-auto flex justify-center items-center gap-2 text-gray-600 hover:text-gray-900 font-bold bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Billing
        </Link>
        <div className="w-full sm:w-auto">
          <PrintButton />
        </div>
      </div>

      {/* The Printable A4 Canvas */}
      <div
        id="invoice-canvas"
        className="bg-white w-full max-w-4xl p-6 sm:p-10 rounded-sm shadow-xl print:shadow-none print:p-0 animate-in fade-in duration-500"
      >
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-gray-800 pb-6 mb-8 gap-6 sm:gap-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#522874] tracking-tighter leading-none">
              UNNATI TRADERS
            </h1>
            {/* FIX: Brought back the Location NAME (e.g., Apollo stock) AND Address */}
            <p className="text-gray-900 mt-2 font-bold text-lg">
              {invoice.location?.name}
            </p>
            {invoice.location?.address && (
              <p className="text-gray-600 font-medium whitespace-pre-wrap">
                {invoice.location.address}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Authorized Apollo Distributor
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Issued under Rule 46 of CGST Rules
            </p>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-800 uppercase tracking-widest">
              Tax Invoice
            </h2>
            <p className="font-bold text-gray-600 mt-2 sm:mt-3 text-sm flex items-center gap-1.5 justify-start sm:justify-end">
              Invoice No:{" "}
              <span className="text-gray-900 font-black">
                {invoice.invoiceNumber}
              </span>
            </p>
            <p className="font-bold text-gray-600 text-sm mt-1 flex items-center gap-1.5 justify-start sm:justify-end">
              Date: <span className="text-gray-900">{formattedDate}</span>
            </p>
          </div>
        </div>

        {/* --- Customer Section (Bill To) --- */}
        <div className="mb-10">
          <h3 className="font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-1 uppercase text-xs tracking-widest">
            Bill To:
          </h3>

          <div className="space-y-1.5">
            <p className="font-black text-2xl text-gray-950 leading-tight">
              {invoice.customer?.name}
            </p>
            <p className="text-gray-700 font-bold">
              {invoice.customer?.phone || "N/A"}
            </p>
            <p className="text-gray-600 text-sm">
              {invoice.customer?.address || ""}
            </p>

            {invoice.customer?.gstNumber && (
              <p className="text-[#522874] font-black mt-3 text-sm bg-purple-50 inline-block px-3 py-1 rounded-full border border-purple-200 uppercase tracking-widest">
                GSTIN: {invoice.customer.gstNumber}
              </p>
            )}

            <div className="flex flex-wrap gap-2.5 mt-3 pt-3 border-t border-gray-100">
              <p className="text-gray-600 font-bold text-xs bg-gray-100 text-gray-800 w-fit px-3 py-1 rounded-full uppercase">
                TYPE: {invoice.customer?.type.replace("_", " ")}
              </p>
              <p className="text-gray-600 font-bold text-xs bg-purple-50 text-[#522874] w-fit px-3 py-1 rounded-full uppercase border border-purple-100">
                PAYMENT: {invoice.paymentMode}
              </p>
            </div>
          </div>
        </div>

        {/* --- Items Table (Added overflow-x-auto for mobile safety) --- */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-100 border-y-2 border-gray-800 text-sm uppercase tracking-wider">
                <th className="py-4 px-3 font-black text-gray-700 w-12">
                  S.No
                </th>
                <th className="py-4 px-3 font-black text-gray-700">
                  Material Description
                </th>
                <th className="py-4 px-3 font-black text-gray-700 text-center w-16">
                  Qty
                </th>
                <th className="py-4 px-3 font-black text-gray-700 text-right w-28">
                  Unit Price
                </th>
                <th className="py-4 px-3 font-black text-gray-700 text-right w-32">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 text-sm group hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-5 px-3 align-top font-bold text-gray-600">
                    {index + 1}
                  </td>
                  <td className="py-5 px-3">
                    <div className="font-black text-gray-950 text-base leading-tight">
                      {item.product.modelName}{" "}
                      <span className="text-[#522874] font-bold whitespace-nowrap">
                        ({item.product.size})
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-1.5 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
                      <span>SKU: {item.product.sku}</span>
                      {item.tyreCode && (
                        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100 font-black text-[10px] w-fit inline-flex items-center gap-1 uppercase tracking-wider">
                          <Tag className="w-3 h-3" /> CODE: {item.tyreCode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-3 text-center align-top font-black text-gray-900 text-base">
                    {item.quantity}
                  </td>
                  <td className="py-5 px-3 text-right align-top font-medium text-gray-600">
                    ₹
                    {item.unitPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-5 px-3 text-right align-top font-black text-gray-950 text-base">
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

        {/* --- Financial Summary --- */}
        <div className="flex justify-end">
          <div className="w-full sm:w-2/3 md:w-1/2 space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2.5 px-3">
              <span className="text-gray-600 font-medium">Taxable Value</span>
              <span className="font-bold text-gray-800">
                ₹
                {invoice.subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between border-b border-gray-100 pb-2.5 px-3">
              <span className="text-gray-600 font-medium">
                Total GST (Inclusive)
              </span>
              <span className="font-bold text-gray-800">
                ₹
                {invoice.totalGst.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex justify-between bg-purple-50 p-4 sm:p-5 border-y-2 border-gray-800 mt-4 rounded-b-lg border-x border-purple-100">
              <span className="font-black text-lg sm:text-xl text-gray-950">
                Grand Total
              </span>
              <span className="font-black text-xl sm:text-2xl text-purple-700 drop-shadow-sm">
                ₹
                {invoice.grandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {invoice.paymentMode === "CREDIT" && (
              <div className="flex justify-between text-[10px] sm:text-xs font-bold px-3 pt-2 text-orange-600 uppercase tracking-widest bg-orange-50/50 py-1.5 rounded border border-orange-100">
                <span>Paid: ₹{invoice.amountPaid.toLocaleString()}</span>
                <span>
                  Due: ₹
                  {(invoice.grandTotal - invoice.amountPaid).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* --- FIX: Mobile-Responsive Footer Notes --- */}
        {/* Changed to flex-col sm:flex-row so it stacks perfectly on mobile but aligns horizontally on PC/Print */}
        <div className="mt-16 sm:mt-20 pt-8 border-t-2 border-gray-100 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-1.5 order-2 md:order-1 w-full md:w-auto">
            <p className="font-black text-gray-800 mb-2 uppercase tracking-wider text-sm md:text-xs">
              Terms & Conditions:
            </p>
            <p>
              1. Goods once sold will not be taken back without valid reason.
            </p>
            <p>
              2. Warranty claims are subject to Apollo Tyres official policies.
            </p>
            <p>3. All disputes subject to Bhind Jurisdiction.</p>
          </div>
          <div className="text-center md:text-right w-full md:w-auto order-1 md:order-2 bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-lg border border-gray-100 md:border-none">
            <div className="font-black text-gray-300 text-xl md:text-2xl mb-2.5 italic p-3 md:border border-gray-100 md:bg-gray-50 rounded inline-block md:block">
              Authorized Signatory
            </div>
            <p className="font-black text-gray-800">For UNNATI TRADERS</p>
          </div>
        </div>

        <div className="mt-8 px-4 text-[10px] text-gray-400 text-center uppercase tracking-widest pt-3 border-t border-gray-100">
          This is a computer-generated tax invoice.
        </div>
      </div>
    </div>
  );
}

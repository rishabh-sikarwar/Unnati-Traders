import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Receipt, HandCoins, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { toDecimal } from "@/lib/money";
import StatementPrintButton from "./statement-print-button";
import InvoicePreviewModal from "@/components/customers/invoice-preview-modal";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, parseISO } from "date-fns";
import StatementToolbar from "./statement-toolbar";

export const dynamic = "force-dynamic";

export default async function CustomerStatementPage({ params, searchParams }) {
  const { id } = await params;
  const queries = await searchParams; // Await in Next.js 15

  const daysFilter = queries?.days || "ALL";
  const shopFilter = queries?.shopId || "ALL";

  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // We are treating the `params.id` URL slug as the Name string since we pass the Name instead of ID now.
  const decodedName = decodeURIComponent(id).toLowerCase().trim();

  // 1. Fetch all customers and manually filter by name to handle duplicates safely
  const allCustomers = await prisma.customer.findMany({
    where: { isArchived: false },
    include: {
      invoices: { orderBy: { createdAt: "asc" } },
      payments: {
        where: {
          paymentMode: {
            not: "RETURN_CREDIT",
          },
        },
        orderBy: { createdAt: "asc" },
      },
      returns: { orderBy: { createdAt: "asc" } },
    },
  });

  const matchingCustomers = allCustomers.filter(
    (c) => c.name.toLowerCase().trim() === decodedName,
  );

  if (matchingCustomers.length === 0) redirect("/customers");

  // Merge Data
  let allInvoices = [];
  let allPayments = [];
  let allReturns = [];
  let openingBalance = toDecimal(0);

  // Use the best available profile info from the latest duplicate
  let bestProfile = matchingCustomers[matchingCustomers.length - 1];

  for (const c of matchingCustomers) {
    allInvoices.push(...c.invoices);
    allPayments.push(...c.payments);
    if (c.returns) allReturns.push(...c.returns);
    openingBalance = openingBalance.plus(toDecimal(c.openingBalance || 0));

    if (c.phone && !bestProfile.phone) bestProfile.phone = c.phone;
    if (c.gstNumber && !bestProfile.gstNumber)
      bestProfile.gstNumber = c.gstNumber;
    if (c.address && !bestProfile.address) bestProfile.address = c.address;
  }

  // Parse date-fns range parameters
  const dateFilter = queries?.date || "all";
  const customStart = queries?.start || "";
  const customEnd = queries?.end || "";
  let startDate = null;
  let endDate = null;

  if (dateFilter === "this_month") {
    startDate = startOfMonth(new Date());
    endDate = endOfMonth(new Date());
  } else if (dateFilter === "last_month") {
    const lastMonthDate = subMonths(new Date(), 1);
    startDate = startOfMonth(lastMonthDate);
    endDate = endOfMonth(lastMonthDate);
  } else if (dateFilter === "custom") {
    startDate = queries.start ? startOfDay(parseISO(queries.start)) : null;
    endDate = queries.end ? endOfDay(parseISO(queries.end)) : null;
  }

  // Apply location filter
  let filteredInvoices = allInvoices;
  let filteredReturns = allReturns;
  if (shopFilter !== "ALL") {
    filteredInvoices = allInvoices.filter((i) => i.locationId === shopFilter);
    filteredReturns = allReturns.filter((r) => r.locationId === shopFilter);
  }

  // Separate transactions into previous and period
  let previousInvoices = [];
  let periodInvoices = [];
  let previousPayments = [];
  let periodPayments = [];
  let previousReturns = [];
  let periodReturns = [];

  if (startDate) {
    previousInvoices = filteredInvoices.filter((i) => new Date(i.createdAt) < startDate);
    periodInvoices = filteredInvoices.filter((i) => {
      const d = new Date(i.createdAt);
      return d >= startDate && (!endDate || d <= endDate);
    });

    previousPayments = allPayments.filter((p) => new Date(p.createdAt) < startDate);
    periodPayments = allPayments.filter((p) => {
      const d = new Date(p.createdAt);
      return d >= startDate && (!endDate || d <= endDate);
    });

    previousReturns = filteredReturns.filter((r) => new Date(r.createdAt) < startDate);
    periodReturns = filteredReturns.filter((r) => {
      const d = new Date(r.createdAt);
      return d >= startDate && (!endDate || d <= endDate);
    });
  } else {
    periodInvoices = filteredInvoices;
    periodPayments = allPayments;
    periodReturns = filteredReturns;
  }

  // Calculate Brought Forward Balance (Opening Balance)
  const previousInvoicesSum = previousInvoices.reduce((sum, i) => sum.plus(toDecimal(i.grandTotal)), toDecimal(0));
  const previousPaymentsSum = previousPayments.reduce((sum, p) => sum.plus(toDecimal(p.amount)), toDecimal(0));
  const previousReturnsSum = previousReturns.reduce((sum, r) => sum.plus(toDecimal(r.refundAmount)), toDecimal(0));

  const broughtForwardBalance = openingBalance
    .plus(previousInvoicesSum)
    .minus(previousPaymentsSum)
    .minus(previousReturnsSum);

  // Build Unified chronological timeline of period transactions
  let periodTransactions = [];

  // A. Invoices (Debits)
  periodInvoices.forEach((inv) => {
    periodTransactions.push({
      id: `inv-${inv.id}`,
      date: inv.createdAt,
      type: "BILL",
      description: `Invoice #${inv.invoiceNumber}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      debit: toDecimal(inv.grandTotal),
      credit: toDecimal(0),
    });
  });

  // B. Payments (Credits)
  periodPayments.forEach((pay) => {
    periodTransactions.push({
      id: `pay-${pay.id}`,
      date: pay.createdAt,
      type: "PAYMENT",
      description: `Payment Received (${pay.paymentMode}) ${pay.remarks ? `- ${pay.remarks}` : ""}`,
      debit: toDecimal(0),
      credit: toDecimal(pay.amount),
    });
  });

  // C. Returns (Credits)
  periodReturns.forEach((ret) => {
    periodTransactions.push({
      id: `ret-${ret.id}`,
      date: ret.createdAt,
      type: "RETURN",
      description: `Tyre Return Credit (Qty: ${ret.quantity})`,
      debit: toDecimal(0),
      credit: toDecimal(ret.refundAmount),
    });
  });

  // Sort period transactions chronologically
  periodTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Prepend mock transaction at index 0 for Brought Forward balance
  const oldestPeriodDate = periodTransactions.length > 0 ? periodTransactions[0].date : new Date();
  const mockOpeningDate = startDate ? new Date(startDate) : new Date(oldestPeriodDate);

  periodTransactions.unshift({
    id: `brought-forward-${bestProfile.id}`,
    date: mockOpeningDate,
    type: "OPENING",
    description: "Opening Balance / Brought Forward",
    debit: broughtForwardBalance.gt(0) ? broughtForwardBalance : toDecimal(0),
    credit: broughtForwardBalance.lt(0) ? broughtForwardBalance.abs() : toDecimal(0),
  });

  // Recalculate running balance and total Billed/Paid for period
  let currentBalance = broughtForwardBalance;
  let totalBilled = toDecimal(0);
  let totalPaid = toDecimal(0);

  const statement = periodTransactions.map((t, idx) => {
    if (idx === 0) {
      return {
        ...t,
        debit: broughtForwardBalance.gt(0) ? broughtForwardBalance.toNumber() : 0,
        credit: broughtForwardBalance.lt(0) ? broughtForwardBalance.abs().toNumber() : 0,
        balance: currentBalance.toNumber(),
      };
    }

    currentBalance = currentBalance
      .plus(toDecimal(t.debit))
      .minus(toDecimal(t.credit));

    totalBilled = totalBilled.plus(toDecimal(t.debit));
    totalPaid = totalPaid.plus(toDecimal(t.credit));

    return {
      ...t,
      debit: toDecimal(t.debit).toNumber(),
      credit: toDecimal(t.credit).toNumber(),
      balance: currentBalance.toNumber(),
    };
  });

  // Convert summaries to numbers to prevent serialization errors
  const totalBilledNum = totalBilled.toNumber();
  const totalPaidNum = totalPaid.toNumber();
  const finalOutstandingNum = currentBalance.toNumber();

  // Format the statement period for UI and printing
  const getStatementPeriodLabel = () => {
    if (dateFilter === "all") {
      return "Statement Period: All Time";
    }
    const formatOpts = { day: "2-digit", month: "short", year: "numeric" };
    const startStr = startDate ? new Date(startDate).toLocaleDateString("en-IN", formatOpts) : "";
    const endStr = endDate ? new Date(endDate).toLocaleDateString("en-IN", formatOpts) : "Present";
    if (startStr && endStr) {
      return `Statement Period: ${startStr} to ${endStr}`;
    }
    if (startStr) {
      return `Statement Period: From ${startStr}`;
    }
    return "Statement Period: All Time";
  };
  const periodLabel = getStatementPeriodLabel();

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-20 pt-28 md:pt-36 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link
            href="/customers"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Khata
          </Link>

          {/* Use the new Client Component button here! */}
          <StatementPrintButton />
        </div>

        <StatementToolbar
          initialDate={dateFilter}
          initialStart={customStart}
          initialEnd={customEnd}
        />

        {/* The Statement Paper */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 print:shadow-none print:border-none">
          {/* Header Info */}
          <div className="bg-[#1a0a2e] text-white p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:bg-white print:text-black print:border-b-2 print:border-gray-800 print:p-0 print:pb-6 print:mb-6">
            <div>
              <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
                <User className="text-purple-400 print:hidden" />{" "}
                {bestProfile.name}
              </h1>
              <p className="text-xs text-purple-300 print:text-gray-500 font-bold mb-2">
                {periodLabel}
              </p>
              <p className="text-purple-200 print:text-gray-600 font-medium">
                {bestProfile.phone || "No Phone Number"}
              </p>
              <p className="text-purple-200/60 print:text-gray-500 text-sm mt-1">
                {bestProfile.address || "No Address Provided"}
              </p>
              {bestProfile.gstNumber && (
                <p className="text-purple-200/80 print:text-gray-800 text-sm font-bold mt-2 tracking-widest uppercase">
                  GSTIN: {bestProfile.gstNumber}
                </p>
              )}
            </div>

            <div className="bg-white/10 print:bg-gray-100 p-4 rounded-xl border border-white/20 print:border-gray-200 backdrop-blur-sm text-right min-w-[200px]">
              <p className="text-purple-200 print:text-gray-600 text-xs font-bold uppercase tracking-widest mb-1">
                Current Outstanding
              </p>
              <p
                className={`text-3xl font-black ${finalOutstandingNum > 0 ? "text-orange-400 print:text-gray-900" : "text-green-400 print:text-gray-900"}`}
              >
                {`₹${formatNumber(finalOutstandingNum, 2)}`}
              </p>
            </div>
          </div>

          {/* Quick Summary Bar */}
          <div className="grid grid-cols-2 bg-gray-50 print:bg-transparent border-b border-gray-200 print:border-b-2 print:border-gray-800 print:mb-6">
            <div className="p-4 print:p-2 flex items-center gap-3 border-r border-gray-200 print:border-none">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg print:hidden">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">
                  Total Billed (Debits)
                </p>
                <p className="font-black text-gray-900">
                  {`₹${formatNumber(totalBilledNum, 2)}`}
                </p>
              </div>
            </div>
            <div className="p-4 print:p-2 flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg print:hidden">
                <HandCoins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">
                  Total Paid (Credits)
                </p>
                <p className="font-black text-gray-900">
                  {`₹${formatNumber(totalPaidNum, 2)}`}
                </p>
              </div>
            </div>
          </div>

          {/* The Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-100/50 print:bg-gray-100 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 print:text-gray-800">
                  <th className="py-4 px-6 font-bold">Date</th>
                  <th className="py-4 px-6 font-bold">
                    Transaction Description
                  </th>
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
                      <td className="py-4 px-6 text-sm text-gray-600 font-medium whitespace-nowrap">
                        <Calendar className="w-3 h-3 inline mr-1.5 opacity-50 print:hidden" />
                        {new Date(row.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {row.type === "BILL" ? (
                          <InvoicePreviewModal
                            invoiceId={row.invoiceId}
                            invoiceNumber={row.invoiceNumber}
                          />
                        ) : (
                          <span
                            className={`font-bold ${row.type === "BILL" || row.type === "OPENING" ? "text-gray-900" : "text-green-700 print:text-gray-600"}`}
                          >
                            {row.description}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-red-500 print:text-gray-900">
                        {row.debit > 0 ? `₹${formatNumber(row.debit, 2)}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-green-600 print:text-gray-900">
                        {row.credit > 0
                          ? `₹${formatNumber(row.credit, 2)}`
                          : "-"}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-black text-[#522874] print:text-gray-900">
                        {`₹${formatNumber(row.balance, 2)}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="hidden print:block mt-10 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center uppercase tracking-widest">
            Statement of Account generated from Unnati Traders ERP
          </div>
        </div>
      </div>
    </div>
  );
}

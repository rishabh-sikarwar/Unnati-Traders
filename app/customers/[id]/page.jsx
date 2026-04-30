import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Receipt, HandCoins, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/format";
import StatementPrintButton from "./statement-print-button"; // <-- Import the new button

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
      payments: { orderBy: { createdAt: "asc" } },
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
  let openingBalance = 0;

  // Use the best available profile info from the latest duplicate
  let bestProfile = matchingCustomers[matchingCustomers.length - 1];

  for (const c of matchingCustomers) {
    allInvoices.push(...c.invoices);
    allPayments.push(...c.payments);
    if (c.returns) allReturns.push(...c.returns);
    openingBalance += Number(c.openingBalance || 0);

    if (c.phone && !bestProfile.phone) bestProfile.phone = c.phone;
    if (c.gstNumber && !bestProfile.gstNumber)
      bestProfile.gstNumber = c.gstNumber;
    if (c.address && !bestProfile.address) bestProfile.address = c.address;
  }

  // Handle URL Filters
  if (daysFilter !== "ALL") {
    const cutoffText = parseInt(daysFilter);
    const cutoffDate = new Date(Date.now() - cutoffText * 24 * 60 * 60 * 1000);

    allInvoices = allInvoices.filter(
      (i) => new Date(i.createdAt) >= cutoffDate,
    );
    allPayments = allPayments.filter(
      (p) => new Date(p.createdAt) >= cutoffDate,
    );
    allReturns = allReturns.filter((r) => new Date(r.createdAt) >= cutoffDate);
  }

  if (shopFilter !== "ALL") {
    // Only Sales (Invoices) and Returns are bound to Locations. Payments are global.
    allInvoices = allInvoices.filter((i) => i.locationId === shopFilter);
  }

  // 2. The Ledger Engine: Combine everything into one chronological timeline
  let transactions = [];

  if (openingBalance > 0) {
    const oldestCreatedAt = matchingCustomers.reduce((oldest, c) => {
      if (!oldest) return c.createdAt;
      return new Date(c.createdAt) < new Date(oldest) ? c.createdAt : oldest;
    }, null);

    transactions.push({
      id: `opening-${bestProfile.id}`,
      date: oldestCreatedAt || new Date(),
      type: "OPENING",
      description: "Opening Balance (Previous Due)",
      debit: openingBalance,
      credit: 0,
    });
  }

  // A. Add all Invoices (Debits) and their Upfront Payments (Credits)
  allInvoices.forEach((inv) => {
    // The Bill (Debit)
    transactions.push({
      id: `inv-${inv.id}`,
      date: inv.createdAt,
      type: "BILL",
      description: `Invoice #${inv.invoiceNumber}`,
      debit: inv.grandTotal,
      credit: 0,
    });
  });

  // B. Add all subsequent partial payments (Credits)
  allPayments.forEach((pay) => {
    transactions.push({
      id: `pay-${pay.id}`,
      date: pay.createdAt,
      type: "PAYMENT",
      description: `Payment Received (${pay.paymentMode}) ${pay.remarks ? `- ${pay.remarks}` : ""}`,
      debit: 0,
      credit: pay.amount,
    });
  });

  // C. Add Returns/Credit Notes (Credits)
  if (allReturns.length > 0) {
    allReturns.forEach((ret) => {
      transactions.push({
        id: `ret-${ret.id}`,
        date: ret.createdAt,
        type: "RETURN",
        description: `Tyre Return Credit (Qty: ${ret.quantity})`,
        debit: 0,
        credit: ret.refundAmount,
      });
    });
  }

  // 3. Sort Everything by Date (Oldest to Newest)
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  // 4. Calculate the Running Balance (Like a Bank Passbook)
  let currentBalance = 0;
  let totalBilled = 0;
  let totalPaid = 0;

  const statement = transactions.map((t) => {
    currentBalance += t.debit;
    currentBalance -= t.credit;

    totalBilled += t.debit;
    totalPaid += t.credit;

    return { ...t, balance: currentBalance };
  });

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

        {/* The Statement Paper */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 print:shadow-none print:border-none">
          {/* Header Info */}
          <div className="bg-[#1a0a2e] text-white p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:bg-white print:text-black print:border-b-2 print:border-gray-800 print:p-0 print:pb-6 print:mb-6">
            <div>
              <h1 className="text-3xl font-black mb-1 flex items-center gap-3">
                <User className="text-purple-400 print:hidden" />{" "}
                {bestProfile.name}
              </h1>
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
                className={`text-3xl font-black ${currentBalance > 0 ? "text-orange-400 print:text-gray-900" : "text-green-400 print:text-gray-900"}`}
              >
                {`₹${formatNumber(currentBalance, 2)}`}
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
                  {`₹${formatNumber(totalBilled, 2)}`}
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
                  {`₹${formatNumber(totalPaid, 2)}`}
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
                        <span
                          className={`font-bold ${row.type === "BILL" || row.type === "OPENING" ? "text-gray-900" : "text-green-700 print:text-gray-600"}`}
                        >
                          {row.description}
                        </span>
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

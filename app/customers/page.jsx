import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CustomerLedger from "@/components/customers/customer-ledger";
import { UsersRound, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser) redirect("/");

  // Fetch all customers, their invoices, and their payment logs
  const customers = await prisma.customer.findMany({
    include: {
      invoices: {
        select: { grandTotal: true, amountPaid: true },
      },
      payments: {
        select: { amount: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Calculate financials for each customer
  const ledgerData = customers.map((customer) => {
    // 1. Total amount ever billed to them
    const totalBilled = customer.invoices.reduce(
      (sum, inv) => sum + inv.grandTotal,
      0,
    );

    // 2. Total amount they paid AT THE TIME of billing
    const totalPaidAtBilling = customer.invoices.reduce(
      (sum, inv) => sum + inv.amountPaid,
      0,
    );

    // 3. Total amount they paid LATER (via Payment Logs)
    const totalPaidLater = customer.payments.reduce(
      (sum, pay) => sum + pay.amount,
      0,
    );

    const totalPaid = totalPaidAtBilling + totalPaidLater;
    const outstandingDues = totalBilled - totalPaid;

    return {
      ...customer,
      totalBilled,
      totalPaid,
      outstandingDues,
    };
  });

  // Calculate Global Metrics
  const globalOutstanding = ledgerData.reduce(
    (sum, c) => sum + c.outstandingDues,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UsersRound className="text-[#522874] h-8 w-8" />
              Customer Ledger (Khata)
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              Manage B2B dealers, track credit, and settle outstanding dues.
            </p>
          </div>

          <div className="bg-red-50 border border-red-100 px-5 py-3 rounded-xl shadow-sm flex items-center gap-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Wallet className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
                Total Market Dues
              </span>
              <p className="text-2xl font-black text-red-600 leading-none">
                ₹
                {globalOutstanding.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Client Component for filtering and accepting payments */}
        <CustomerLedger customers={ledgerData} userId={dbUser.id} />
      </div>
    </div>
  );
}

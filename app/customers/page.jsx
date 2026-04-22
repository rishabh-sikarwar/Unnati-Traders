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

  const locations = await prisma.location.findMany({
    select: { id: true, name: true },
  });

  // Fetch all customers, their invoices, and their payment logs
  const customers = await prisma.customer.findMany({
    where: { isArchived: false },
    include: {
      invoices: {
        select: { id: true, grandTotal: true, amountPaid: true, createdAt: true, locationId: true, invoiceNumber: true, paymentMode: true },
      },
      payments: {
        select: { id: true, amount: true, createdAt: true, paymentMode: true, remarks: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Group duplicate customer rows by normalized textual name
  const groupedData = {};
  for (const c of customers) {
    const key = c.name.toLowerCase().trim();
    if (!groupedData[key]) {
      groupedData[key] = {
        name: c.name,
        type: c.type,
        phone: c.phone,
        gstNumber: c.gstNumber,
        address: c.address,
        isArchived: c.isArchived,
        ids: [c.id],
        invoices: [],
        payments: [],
        // Fallback default ID for settlements component
        id: c.id, 
      };
    } else {
      groupedData[key].ids.push(c.id);
      // Fill missing info if subsequent duplicate has it
      if (!groupedData[key].phone && c.phone) groupedData[key].phone = c.phone;
      if (!groupedData[key].gstNumber && c.gstNumber) groupedData[key].gstNumber = c.gstNumber;
      if (!groupedData[key].address && c.address) groupedData[key].address = c.address;
    }
    groupedData[key].invoices.push(...c.invoices);
    groupedData[key].payments.push(...c.payments);
  }

  const mergedCustomers = Object.values(groupedData);

  // We no longer calculate static global metrics here since it needs to be dynamic on the client side based on filters.
  // The client side Client Component <CustomerLedger> will handle global metrics.

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
        </div>

        {/* Client Component for filtering and accepting payments */}
        <CustomerLedger customers={mergedCustomers} locations={locations} userId={dbUser.id} />
      </div>
    </div>
  );
}

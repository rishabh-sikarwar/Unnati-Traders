import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OrdersTable from "@/components/orders/orders-table";
import { ScrollText, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
    include: { location: true },
  });

  if (!dbUser) redirect("/");

  // ROLE-BASED ACCESS CONTROL
  // Admins see everything. Shopkeepers see only their own shop's invoices.
  const whereClause =
    dbUser.role === "ADMIN" ? {} : { locationId: dbUser.locationId };

  // Failsafe: If a shopkeeper has no shop assigned yet, they can't see orders.
  if (dbUser.role !== "ADMIN" && !dbUser.locationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">No Shop Assigned</h2>
          <p className="text-gray-500 mt-2">
            Please ask the Admin to assign your account to a retail location to
            view order history.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the invoices with customer data and item counts
  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      customer: true,
      location: true,
      _count: {
        select: { items: true }, // Just get the number of items to keep the query fast
      },
    },
    orderBy: { createdAt: "desc" }, // Newest first
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ScrollText className="text-[#522874] h-8 w-8" />
              Invoice History
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              {dbUser.role === "ADMIN"
                ? "Viewing all network-wide sales and invoices."
                : `Viewing sales history for ${dbUser.location?.name}.`}
            </p>
          </div>

          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Total Invoices
            </span>
            <p className="text-xl font-black text-[#522874] leading-none">
              {invoices.length}
            </p>
          </div>
        </div>

        {/* Pass data to the interactive client table */}
        <OrdersTable initialOrders={invoices} userRole={dbUser.role} locations={locations} />
      </div>
    </div>
  );
}

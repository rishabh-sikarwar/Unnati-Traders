import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OrdersTable from "@/components/orders/orders-table";
import { ScrollText, ShieldAlert, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getIstDateFilter } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
    include: { location: true },
  });

  if (!dbUser) redirect("/");

  // Failsafe for unassigned Shopkeepers
  if (dbUser.role !== "ADMIN" && !dbUser.locationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">No Shop Assigned</h2>
          <p className="text-gray-500 mt-2">
            Please ask the Admin to assign your account to a retail location to view order history.
          </p>
        </div>
      </div>
    );
  }

  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });

  // Fetch pending dealer order requests count for admin/shopkeeper (both PENDING fulfillment & BILLED pending payment verification)
  let pendingRequestsCount = 0;
  if (dbUser.role === "ADMIN" || dbUser.role === "SHOPKEEPER") {
    const pendingWhere =
      dbUser.role === "SHOPKEEPER" 
        ? { locationId: dbUser.locationId, status: { in: ["PENDING", "BILLED"] } }
        : { status: { in: ["PENDING", "BILLED"] } };
    pendingRequestsCount = await prisma.dealerOrder.count({ where: pendingWhere });
  }

  // --- 1. READ URL PARAMETERS ---
  // In Next.js 15, searchParams is an async promise
  const queries = await searchParams; 
  const dateFilter = queries?.date || "today"; // DEFAULT TO TODAY!
  const shopFilter = queries?.shopId || "ALL";
  const typeFilter = queries?.type || "ALL";
  const customStart = queries?.start;
  const customEnd = queries?.end;

  // --- 2. BUILD SECURE WHERE CLAUSE ---
  let whereClause = {};

  // A. Secure Location Filter
  if (dbUser.role === "ADMIN") {
    if (shopFilter !== "ALL") whereClause.locationId = shopFilter;
  } else {
    whereClause.locationId = dbUser.locationId; // Force lock to Shopkeeper's location
  }

  // B. B2B / B2C Filter
  if (typeFilter === "B2B") {
    whereClause.customer = { type: { in: ["SUB_DEALER", "DISTRIBUTOR"] } };
  } else if (typeFilter === "B2C") {
    whereClause.customer = { type: "RETAIL" };
  }

  // C. Date Filter Logic (IST Midnight & Predefined Ranges)
  const dateRange = getIstDateFilter(dateFilter, customStart, customEnd);
  if (dateRange) {
    whereClause.createdAt = dateRange;
  }
  // If "all", we don't add a date filter, but we WILL limit the fetch to 500 records to protect the server.

  // --- 3. FETCH OPTIMIZED DATA ---
  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      customer: true,
      location: true,
      payments: true,
      items: { select: { quantity: true } },
      _count: { select: { items: true } },
    },
    orderBy: { invoiceNumber: "desc" },
    take: 500, // SAFEGUARD: Never fetch more than 500 at a time to prevent memory crashes
  });

  const serializedInvoices = invoices.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    totalGst: Number(inv.totalGst),
    grandTotal: Number(inv.grandTotal),
    amountPaid: Number(inv.amountPaid),
    splitCash: Number(inv.splitCash),
    splitUpi: Number(inv.splitUpi),
    splitCard: Number(inv.splitCard),
    customer: inv.customer ? {
      ...inv.customer,
      openingBalance: Number(inv.customer.openingBalance),
    } : null,
    payments: (inv.payments || []).map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
    totalItemsCount: inv.items
      ? inv.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ScrollText className="text-[#522874] h-8 w-8" />
              Sales Register
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              {dbUser.role === "ADMIN"
                ? "Viewing network-wide sales and invoices."
                : `Viewing sales history for ${dbUser.location?.name}.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(dbUser.role === "ADMIN" || dbUser.role === "SHOPKEEPER") && (
              <Link href="/orders/dealer-requests">
                <Button className="bg-[#522874] hover:bg-[#432060] text-white flex items-center gap-2 shadow-sm font-semibold">
                  <Truck className="w-4 h-4" />
                  <span>Dealer Order Requests</span>
                  {pendingRequestsCount > 0 && (
                    <span className="ml-1 bg-amber-400 text-purple-950 font-bold text-xs px-2 py-0.5 rounded-full">
                      {pendingRequestsCount} new
                    </span>
                  )}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Pass the data AND the current active filters to the UI */}
        <OrdersTable 
          initialOrders={serializedInvoices} 
          userRole={dbUser.role} 
          locations={locations} 
          currentFilters={{ dateFilter, shopFilter, typeFilter, customStart, customEnd }}
        />
      </div>
    </div>
  );
}
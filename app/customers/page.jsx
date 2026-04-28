import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CustomerLedger from "@/components/customers/customer-ledger";
import { UsersRound } from "lucide-react";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
} from "date-fns";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser) redirect("/");

  const locations = await prisma.location.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // --- 1. READ URL PARAMETERS ---
  const queries = await searchParams;
  const searchQuery = (queries?.search || "").toLowerCase();
  const shopFilter = queries?.shopId || "ALL";
  const duesOnly = queries?.duesOnly === "true";

  // NEW DATE FILTERS
  const dateFilter = queries?.date || "all";
  const customStart = queries?.start;
  const customEnd = queries?.end;

  // Calculate Cutoff Dates based on selection
  let cutoffStart = null;
  let cutoffEnd = null;
  const now = new Date();

  if (dateFilter === "today") {
    cutoffStart = startOfDay(now);
    cutoffEnd = endOfDay(now);
  } else if (dateFilter === "yesterday") {
    const yesterday = subDays(now, 1);
    cutoffStart = startOfDay(yesterday);
    cutoffEnd = endOfDay(yesterday);
  } else if (dateFilter === "this_month") {
    cutoffStart = startOfMonth(now);
    cutoffEnd = endOfDay(now);
  } else if (dateFilter === "last_month") {
    const lastMonth = subMonths(now, 1);
    cutoffStart = startOfMonth(lastMonth);
    cutoffEnd = endOfMonth(lastMonth);
  } else if (dateFilter === "custom" && customStart && customEnd) {
    cutoffStart = startOfDay(new Date(customStart));
    cutoffEnd = endOfDay(new Date(customEnd));
  }

  // --- 2. FETCH MINIMAL DATA FROM DB ---
  const customers = await prisma.customer.findMany({
    where: { isArchived: false },
    include: {
      invoices: {
        select: { grandTotal: true, createdAt: true, locationId: true },
      },
      payments: { select: { amount: true, createdAt: true } },
    },
    orderBy: { name: "asc" },
  });

  // --- 3. SERVER-SIDE MATH & DEDUPLICATION ---
  const groupedData = {};
  let globalOutstanding = 0;

  for (const c of customers) {
    const key = c.name.toLowerCase().trim();
    if (!groupedData[key]) {
      groupedData[key] = {
        name: c.name,
        type: c.type,
        phone: c.phone,
        gstNumber: c.gstNumber,
        address: c.address,
        ids: [c.id],
        id: c.id,
        globalBilled: 0,
        globalPaid: 0,
        openingBalance: 0,
        displayBilled: 0,
        displayPaid: 0,
        interactedWithShop: false,
      };
    } else {
      groupedData[key].ids.push(c.id);
      if (!groupedData[key].phone && c.phone) groupedData[key].phone = c.phone;
    }

    const group = groupedData[key];
    group.openingBalance += Number(c.openingBalance || 0);

    // Process Invoices
    for (const inv of c.invoices) {
      group.globalBilled += inv.grandTotal;
      if (shopFilter === "ALL" || inv.locationId === shopFilter) {
        group.interactedWithShop = true;
      }

      const invDate = new Date(inv.createdAt);
      if (
        (!cutoffStart || invDate >= cutoffStart) &&
        (!cutoffEnd || invDate <= cutoffEnd)
      ) {
        group.displayBilled += inv.grandTotal;
      }
    }

    // Process Payments
    for (const pay of c.payments) {
      group.globalPaid += pay.amount;

      const payDate = new Date(pay.createdAt);
      if (
        (!cutoffStart || payDate >= cutoffStart) &&
        (!cutoffEnd || payDate <= cutoffEnd)
      ) {
        group.displayPaid += pay.amount;
      }
    }
  }

  // --- 4. FILTER AND FORMAT FOR CLIENT ---
  let processedCustomers = [];

  for (const group of Object.values(groupedData)) {
    const outstandingDues =
      group.globalBilled + group.openingBalance - group.globalPaid;
    group.outstandingDues = outstandingDues;

    // Apply Filters
    if (
      searchQuery &&
      !group.name.toLowerCase().includes(searchQuery) &&
      !(group.phone && group.phone.includes(searchQuery))
    )
      continue;
    if (duesOnly && outstandingDues <= 0) continue;
    if (shopFilter !== "ALL" && !group.interactedWithShop) continue;

    // If a date filter is applied, only show customers who had activity OR owe money
    const hasActivity =
      dateFilter === "all" ||
      group.displayBilled > 0 ||
      group.displayPaid > 0 ||
      outstandingDues > 0;
    if (!hasActivity) continue;

    processedCustomers.push(group);

    if (outstandingDues > 0) {
      globalOutstanding += outstandingDues;
    }
  }

  const finalCustomers = processedCustomers.slice(0, 200);

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
              Manage B2B dealers, track credit, and view daily activity.
            </p>
          </div>
        </div>

        <CustomerLedger
          customers={finalCustomers}
          globalOutstanding={globalOutstanding}
          locations={locations}
          userId={dbUser.id}
          currentFilters={{
            searchQuery,
            shopFilter,
            dateFilter,
            customStart,
            customEnd,
            duesOnly,
          }}
        />
      </div>
    </div>
  );
}

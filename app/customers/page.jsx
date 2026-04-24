import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CustomerLedger from "@/components/customers/customer-ledger";
import { UsersRound, Wallet } from "lucide-react";
import { subDays, startOfDay } from "date-fns";

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
    orderBy: { name: "asc" }
  });

  // --- 1. READ URL PARAMETERS ---
  const queries = await searchParams;
  const searchQuery = (queries?.search || "").toLowerCase();
  const shopFilter = queries?.shopId || "ALL";
  const dateFilter = queries?.days || "ALL";
  const duesOnly = queries?.duesOnly === "true";

  // Calculate Cutoff Date
  let cutoffDate = null;
  if (dateFilter !== "ALL") {
    cutoffDate = startOfDay(subDays(new Date(), parseInt(dateFilter)));
  }

  // --- 2. FETCH MINIMAL DATA FROM DB ---
  // We ONLY fetch the fields needed for math to keep the query lightning fast
  const customers = await prisma.customer.findMany({
    where: { isArchived: false },
    include: {
      invoices: {
        select: { grandTotal: true, createdAt: true, locationId: true },
      },
      payments: {
        select: { amount: true, createdAt: true },
      },
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
        name: c.name, type: c.type, phone: c.phone, gstNumber: c.gstNumber, address: c.address, ids: [c.id], id: c.id,
        globalBilled: 0, globalPaid: 0, displayBilled: 0, displayPaid: 0, interactedWithShop: false
      };
    } else {
      groupedData[key].ids.push(c.id);
      if (!groupedData[key].phone && c.phone) groupedData[key].phone = c.phone;
    }

    const group = groupedData[key];

    // Process Invoices
    for (const inv of c.invoices) {
      group.globalBilled += inv.grandTotal;
      if (shopFilter === "ALL" || inv.locationId === shopFilter) {
        group.interactedWithShop = true;
      }
      if (!cutoffDate || new Date(inv.createdAt) >= cutoffDate) {
        group.displayBilled += inv.grandTotal;
      }
    }

    // Process Payments
    for (const pay of c.payments) {
      group.globalPaid += pay.amount;
      if (!cutoffDate || new Date(pay.createdAt) >= cutoffDate) {
        group.displayPaid += pay.amount;
      }
    }
  }

  // --- 4. FILTER AND FORMAT FOR CLIENT ---
  let processedCustomers = [];

  for (const group of Object.values(groupedData)) {
    const outstandingDues = group.globalBilled - group.globalPaid;
    group.outstandingDues = outstandingDues;

    // Apply Filters
    if (searchQuery && !group.name.toLowerCase().includes(searchQuery) && !(group.phone && group.phone.includes(searchQuery))) continue;
    if (duesOnly && outstandingDues <= 0) continue;
    if (shopFilter !== "ALL" && !group.interactedWithShop) continue;
    
    // If a date filter is applied, only show customers who had activity OR owe money
    const hasActivity = dateFilter === "ALL" || group.displayBilled > 0 || group.displayPaid > 0 || outstandingDues > 0;
    if (!hasActivity) continue;

    processedCustomers.push(group);
    
    if (outstandingDues > 0) {
      globalOutstanding += outstandingDues;
    }
  }

  // SAFEGUARD: Only send the top 200 results to the browser to prevent lag. 
  // The user can use the search bar to find anyone not in the top 200.
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
              Manage B2B dealers, track credit, and settle outstanding dues.
            </p>
          </div>
        </div>

        {/* Pass the LIGHTWEIGHT calculated data to the interactive client form */}
        <CustomerLedger 
          customers={finalCustomers} 
          globalOutstanding={globalOutstanding}
          locations={locations} 
          userId={dbUser.id} 
          currentFilters={{ searchQuery, shopFilter, dateFilter, duesOnly }}
        />
      </div>
    </div>
  );
}
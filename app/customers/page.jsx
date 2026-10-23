import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CustomerLedger from "@/components/customers/customer-ledger";
import { UsersRound } from "lucide-react";
import { toDecimal } from "@/lib/money";
import { getIstDateFilter } from "@/lib/date-utils";

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

  // DEFAULT DATE FILTER: "this_month" in IST
  const dateFilter = queries?.date || "this_month";
  const customStart = queries?.start;
  const customEnd = queries?.end;

  // Calculate IST Date Range using date-utils
  const dateRange = getIstDateFilter(dateFilter, customStart, customEnd);
  const cutoffStart = dateRange?.gte || null;
  const cutoffEnd = dateRange?.lte || null;

  // --- 2. FETCH ACTIVE CUSTOMERS FOR LEDGER & MARKET DUES ---
  const customers = await prisma.customer.findMany({
    where: {
      isArchived: false,
    },
    include: {
      invoices: {
        select: {
          id: true,
          grandTotal: true,
          amountPaid: true,
          paymentMode: true,
          createdAt: true,
          locationId: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentMode: true,
          createdAt: true,
          invoiceId: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // --- 3. SERVER-SIDE MATH & DEDUPLICATION ---
  const customerShopMap = new Map();
  const groupedData = {};
  let filteredMarketDues = toDecimal(0);

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
        globalBilled: toDecimal(0),
        globalPaid: toDecimal(0),
        openingBalance: toDecimal(0),
        displayBilled: toDecimal(0),
        displayPaid: toDecimal(0),
        interactedWithShop: false,
      };
    } else {
      groupedData[key].ids.push(c.id);
      if (!groupedData[key].phone && c.phone) groupedData[key].phone = c.phone;
    }

    const group = groupedData[key];
    group.openingBalance = group.openingBalance.plus(
      toDecimal(c.openingBalance || 0),
    );

    const shopSet = new Set();

    // Process Invoices
    for (const inv of c.invoices) {
      group.globalBilled = group.globalBilled.plus(toDecimal(inv.grandTotal));
      if (inv.locationId) shopSet.add(inv.locationId);
      if (shopFilter === "ALL" || inv.locationId === shopFilter) {
        group.interactedWithShop = true;
      }

      const invDate = new Date(inv.createdAt);
      if (
        (!cutoffStart || invDate >= cutoffStart) &&
        (!cutoffEnd || invDate <= cutoffEnd)
      ) {
        group.displayBilled = group.displayBilled.plus(
          toDecimal(inv.grandTotal),
        );
      }
    }

    // Process Payments
    for (const pay of c.payments) {
      group.globalPaid = group.globalPaid.plus(toDecimal(pay.amount));

      const payDate = new Date(pay.createdAt);
      if (
        (!cutoffStart || payDate >= cutoffStart) &&
        (!cutoffEnd || payDate <= cutoffEnd)
      ) {
        group.displayPaid = group.displayPaid.plus(toDecimal(pay.amount));
      }
    }

    customerShopMap.set(c.id, shopSet);
  }

  // --- 4. FILTER AND FORMAT CUSTOMERS FOR TABLE ---
  let processedCustomers = [];

  for (const group of Object.values(groupedData)) {
    const outstandingDues = group.globalBilled
      .plus(group.openingBalance)
      .minus(group.globalPaid);
    group.outstandingDues = outstandingDues;

    // Filter Market Dues respects shopFilter
    if (shopFilter === "ALL" || group.interactedWithShop) {
      if (outstandingDues.gt(0)) {
        filteredMarketDues = filteredMarketDues.plus(outstandingDues);
      }
    }

    // Apply Filters for Table Display
    if (
      searchQuery &&
      !group.name.toLowerCase().includes(searchQuery) &&
      !(group.phone && group.phone.includes(searchQuery))
    )
      continue;
    if (duesOnly && !outstandingDues.gt(0)) continue;
    if (shopFilter !== "ALL" && !group.interactedWithShop) continue;

    // If a date filter is applied (not "all"), show customers active within window or if duesOnly
    const hasActivity =
      dateFilter === "all" ||
      group.displayBilled.gt(0) ||
      group.displayPaid.gt(0);
    if (!hasActivity && !duesOnly) continue;

    processedCustomers.push(group);
  }

  // --- 5. TIMELINE RECOVERY ANALYTICS (Dues Paid / Credit Settlements) ---
  const users = await prisma.user.findMany({ select: { id: true, locationId: true } });
  const userLocMap = new Map(users.map((u) => [u.id, u.locationId]));

  const paymentsInPeriod = await prisma.paymentLog.findMany({
    where: {
      paymentMode: { not: "RETURN_CREDIT" },
      ...(dateRange ? { createdAt: dateRange } : {}),
    },
    select: {
      id: true,
      amount: true,
      paymentMode: true,
      invoiceId: true,
      userId: true,
      customerId: true,
      invoice: { select: { locationId: true } },
    },
  });

  let duesRecovered = toDecimal(0);
  let settlementCount = 0;
  let cashRecovered = toDecimal(0);
  let upiRecovered = toDecimal(0);
  let bankRecovered = toDecimal(0);

  for (const p of paymentsInPeriod) {
    if (shopFilter !== "ALL") {
      const invLoc = p.invoice?.locationId;
      const userLoc = userLocMap.get(p.userId);
      const custShops = customerShopMap.get(p.customerId);
      const match =
        invLoc === shopFilter ||
        userLoc === shopFilter ||
        (custShops && custShops.has(shopFilter));
      if (!match) continue;
    }

    // Track Udhaar / Dues Paid (Credit Settlements against customer dues)
    if (p.invoiceId === null) {
      const pAmt = toDecimal(p.amount);
      duesRecovered = duesRecovered.plus(pAmt);
      settlementCount++;

      if (p.paymentMode === "CASH") {
        cashRecovered = cashRecovered.plus(pAmt);
      } else if (p.paymentMode === "UPI") {
        upiRecovered = upiRecovered.plus(pAmt);
      } else {
        bankRecovered = bankRecovered.plus(pAmt);
      }
    }
  }

  // Fetch Invoices in dateRange for New Credit Given
  const invoicesInPeriod = await prisma.invoice.findMany({
    where: {
      ...(dateRange ? { createdAt: dateRange } : {}),
      ...(shopFilter !== "ALL" ? { locationId: shopFilter } : {}),
    },
    select: {
      id: true,
      grandTotal: true,
      amountPaid: true,
      paymentMode: true,
    },
  });

  let newCreditGiven = toDecimal(0);
  let creditBillsCount = 0;

  for (const inv of invoicesInPeriod) {
    const total = toDecimal(inv.grandTotal);
    const paid = toDecimal(inv.amountPaid);
    const unpaid = total.minus(paid);
    if (unpaid.gt(0) || inv.paymentMode === "CREDIT") {
      newCreditGiven = newCreditGiven.plus(unpaid.gt(0) ? unpaid : toDecimal(0));
      creditBillsCount++;
    }
  }

  const analytics = {
    filteredMarketDues: Number(filteredMarketDues),
    duesRecovered: Number(duesRecovered),
    settlementCount,
    cashRecovered: Number(cashRecovered),
    upiRecovered: Number(upiRecovered),
    bankRecovered: Number(bankRecovered),
    newCreditGiven: Number(newCreditGiven),
    creditBillsCount,
  };

  const finalCustomers = processedCustomers.slice(0, 200);

  const cleanCustomers = finalCustomers.map((customer) => ({
    ...customer,
    globalBilled: Number(customer.globalBilled),
    globalPaid: Number(customer.globalPaid),
    openingBalance: Number(customer.openingBalance),
    displayBilled: Number(customer.displayBilled),
    displayPaid: Number(customer.displayPaid),
    outstandingDues: Number(customer.outstandingDues),
  }));

  const safeCustomers = JSON.parse(JSON.stringify(cleanCustomers));
  const safeAnalytics = JSON.parse(JSON.stringify(analytics));
  const cleanGlobalOutstanding = Number(filteredMarketDues);

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
          customers={safeCustomers}
          globalOutstanding={cleanGlobalOutstanding}
          analytics={safeAnalytics}
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


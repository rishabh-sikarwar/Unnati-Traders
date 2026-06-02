import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, CalendarDays, Filter, RefreshCcw } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

function sumQuantity(records = []) {
  return records.reduce((total, record) => total + (record.quantity || 0), 0);
}

function getUserLabel(user) {
  return user?.fullName || user?.email || "System";
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ItemLedgerPage({ params, searchParams }) {
  // 1. SAFELY UNWRAP PROMISES
  const { productId } = await params;
  const awaitedParams = await searchParams;

  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser) redirect("/");

  // 2. DATE FILTER LOGIC
  const dateFilter = awaitedParams.date || "this_month";
  const customStart = awaitedParams.start;
  const customEnd = awaitedParams.end;

  const now = new Date();
  let startDate, endDate, targetMonth, targetYear;
  let isCurrentMonth = false;

  if (dateFilter === "this_month") {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
    targetMonth = startDate.getMonth() + 1;
    targetYear = startDate.getFullYear();
    isCurrentMonth = true;
  } else if (dateFilter === "last_month") {
    const lastM = subMonths(now, 1);
    startDate = startOfMonth(lastM);
    endDate = endOfMonth(lastM);
    targetMonth = startDate.getMonth() + 1;
    targetYear = startDate.getFullYear();
  } else if (dateFilter === "custom" && customStart && customEnd) {
    startDate = startOfDay(new Date(customStart));
    endDate = endOfDay(new Date(customEnd));
    targetMonth = startDate.getMonth() + 1;
    targetYear = startDate.getFullYear();
  } else {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
    targetMonth = startDate.getMonth() + 1;
    targetYear = startDate.getFullYear();
    isCurrentMonth = true;
  }

  // 3. FETCH DATA
  const [product, invoices, purchases, transferLogs, snapshots] =
    await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: {
          inventories: { include: { location: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { createdAt: { gte: startDate, lt: endDate } },
        include: { location: true, user: true, items: { where: { productId } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchase.findMany({
        where: { purchaseDate: { gte: startDate, lt: endDate } },
        include: { location: true, user: true, items: { where: { productId } } },
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.transferLog.findMany({
        where: { productId, createdAt: { gte: startDate, lt: endDate } },
        include: { fromLocation: true, toLocation: true, user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.stockSnapshot.findMany({
        where: { productId, month: targetMonth, year: targetYear },
      }),
    ]);

  if (!product) notFound();

  // 4. PROCESS TIMELINE & METRICS
  const currentLiveStock = sumQuantity(product.inventories);

  const monthlySales = invoices.flatMap((invoice) =>
    invoice.items.map((item) => ({
      date: invoice.createdAt,
      type: "SALE",
      reference: invoice.invoiceNumber,
      location: invoice.location?.name || "Unknown",
      qtyIn: 0,
      qtyOut: item.quantity,
      user: getUserLabel(invoice.user),
    }))
  );

  const monthlyPurchases = purchases.flatMap((purchase) =>
    purchase.items.map((item) => ({
      date: purchase.purchaseDate,
      type: "PURCHASE",
      reference: purchase.invoiceNumber,
      location: purchase.location?.name || "Unknown",
      qtyIn: item.quantity,
      qtyOut: 0,
      user: getUserLabel(purchase.user),
    }))
  );

  let totalTransfers = 0;
  const monthlyTransfers = transferLogs.map((transfer) => {
    totalTransfers += transfer.quantity;
    return {
      date: transfer.createdAt,
      type: "TRANSFER",
      reference: `XFER-${transfer.id.slice(0, 8).toUpperCase()}`,
      location: `${transfer.fromLocation?.name || "Unknown"} → ${transfer.toLocation?.name || "Unknown"}`,
      qtyIn: transfer.quantity,
      qtyOut: transfer.quantity,
      user: getUserLabel(transfer.user),
    };
  });

  const timeline = [...monthlySales, ...monthlyPurchases, ...monthlyTransfers].sort(
    (left, right) => new Date(right.date) - new Date(left.date)
  );

  const salesOut = sumQuantity(monthlySales.map((item) => ({ quantity: item.qtyOut })));
  const purchasesIn = sumQuantity(monthlyPurchases.map((item) => ({ quantity: item.qtyIn })));
  
  const openingStockFromSnapshots = sumQuantity(snapshots);
  const hasSnapshot = snapshots.length > 0;
  const openingStockSource = hasSnapshot ? "Static Snapshot" : "Dynamic Fallback";
  
  // Calculate Opening and Closing effectively
  let openingStock = 0;
  let closingStock = 0;
  
  if (isCurrentMonth) {
    closingStock = currentLiveStock;
    openingStock = hasSnapshot ? openingStockFromSnapshots : (currentLiveStock + salesOut - purchasesIn);
  } else {
    openingStock = hasSnapshot ? openingStockFromSnapshots : 0;
    closingStock = openingStock + purchasesIn - salesOut;
  }

  const statCards = [
    { label: "Opening Stock", value: openingStock, note: openingStockSource, accent: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
    { label: "Total In", value: purchasesIn, note: "Purchases in range", accent: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
    { label: "Total Out", value: salesOut, note: "Sales in range", accent: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
    { label: "Internal Transfers", value: totalTransfers, note: "Movement between shops", accent: "text-sky-700", bg: "bg-sky-50 border-sky-100" },
    { label: isCurrentMonth ? "Current Live Stock" : "Closing Stock", value: closingStock, note: isCurrentMonth ? "Live inventory balance" : "Opening + In - Out", accent: "text-slate-800", bg: "bg-slate-50 border-slate-200" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-10 pt-24 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-[#522874]/30 hover:text-[#522874] transition-colors"
          >
            <ChevronLeft size={16} /> Back to Inventory
          </Link>
        </div>

        {/* --- PRODUCT HEADER --- */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#522874]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#522874]">
                <Package size={14} /> Item Ledger
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900">{product.modelName}</h1>
                <p className="mt-2 text-sm md:text-base text-gray-500 font-medium">
                  {product.brand} · {product.size}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-400">SKU</div>
              <div className="mt-1 font-mono font-semibold text-[#522874]">{product.sku}</div>
            </div>
          </div>
        </section>

        {/* --- DATE FILTER TOOLBAR --- */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <form method="get" className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-auto text-xs font-bold uppercase text-gray-500 tracking-wider">
              Date Filter
            </div>
            <div className="relative flex-1 w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                name="date"
                defaultValue={dateFilter}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none bg-white cursor-pointer text-sm font-bold text-gray-700 shadow-sm"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="date" name="start" defaultValue={customStart || ""} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium outline-none shadow-sm flex-1" />
                <span className="text-gray-400 font-medium">to</span>
                <input type="date" name="end" defaultValue={customEnd || ""} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium outline-none shadow-sm flex-1" />
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button type="submit" className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#522874] text-white font-bold hover:bg-[#3d1d56] transition-all shadow-sm text-sm">
                Apply
              </button>
              <Link href={`/inventory/${productId}`} className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-all shadow-sm text-sm bg-white gap-2">
                <RefreshCcw size={16} /> Reset
              </Link>
            </div>
          </form>
        </section>

        {/* --- 5 STAT CARDS --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border ${card.bg} p-5 shadow-sm`}>
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500">{card.label}</div>
              <div className={`mt-3 text-3xl font-black ${card.accent}`}>{card.value}</div>
              <div className="mt-2 text-xs text-gray-600 font-medium">{card.note}</div>
            </div>
          ))}
        </section>

        {/* --- UNIFIED TIMELINE --- */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">Unified Timeline</h2>
            <p className="text-sm text-gray-500 mt-1">Sales, purchases, and transfers for the selected period.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Qty In</th>
                  <th className="px-6 py-4 text-center">Qty Out</th>
                  <th className="px-6 py-4">User</th>
                </tr>
              </thead>
              <tbody>
                {timeline.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No activity found for this period.
                    </td>
                  </tr>
                ) : (
                  timeline.map((item, index) => {
                    const colorClasses = item.type === "SALE" ? "bg-rose-50 text-rose-700 border-rose-200" : item.type === "PURCHASE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-sky-50 text-sky-700 border-sky-200";
                    return (
                      <tr key={`${item.type}-${item.reference}-${index}`} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-600 whitespace-nowrap">{formatDateTime(item.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${colorClasses}`}>{item.type}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.reference}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.location}</td>
                        <td className="px-6 py-4 text-center text-sm font-black text-emerald-700">{item.qtyIn > 0 ? item.qtyIn : "-"}</td>
                        <td className="px-6 py-4 text-center text-sm font-black text-rose-700">{item.qtyOut > 0 ? item.qtyOut : "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.user}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  CalendarDays,
  Package,
  Filter,
  RotateCcw,
} from "lucide-react";
import {
  endOfDay,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

export const dynamic = "force-dynamic";

function getSearchParamValue(value) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseDateInput(value, fallback) {
  if (!value) return fallback;

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : fallback;
}

function sumQuantity(records = []) {
  return records.reduce((total, record) => total + (record.quantity || 0), 0);
}

function getUserLabel(user) {
  return user?.fullName || user?.email || "System";
}

function formatDateTime(value) {
  return format(new Date(value), "dd MMM yyyy, hh:mm a");
}

function getFilterConfig(searchParams = {}) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const rawFilter = getSearchParamValue(searchParams.date);
  const selectedDateFilter = ["this_month", "last_month", "custom"].includes(
    rawFilter,
  )
    ? rawFilter
    : "this_month";

  let startDate = currentMonthStart;
  let endDate = currentMonthEnd;

  if (selectedDateFilter === "last_month") {
    const previousMonth = subMonths(now, 1);
    startDate = startOfMonth(previousMonth);
    endDate = endOfMonth(previousMonth);
  }

  let customStart = format(currentMonthStart, "yyyy-MM-dd");
  let customEnd = format(currentMonthEnd, "yyyy-MM-dd");

  if (selectedDateFilter === "custom") {
    const startInput = getSearchParamValue(searchParams.start);
    const endInput = getSearchParamValue(searchParams.end);
    const parsedStart = parseDateInput(startInput, currentMonthStart);
    const parsedEnd = parseDateInput(endInput, currentMonthEnd);
    const normalizedStart = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
    const normalizedEnd = parsedStart <= parsedEnd ? parsedEnd : parsedStart;

    startDate = startOfDay(normalizedStart);
    endDate = endOfDay(normalizedEnd);
    customStart = format(normalizedStart, "yyyy-MM-dd");
    customEnd = format(normalizedEnd, "yyyy-MM-dd");
  }

  const targetMonth = startDate.getMonth() + 1;
  const targetYear = startDate.getFullYear();
  const isCurrentMonthView =
    selectedDateFilter === "this_month" &&
    targetMonth === now.getMonth() + 1 &&
    targetYear === now.getFullYear();

  return {
    selectedDateFilter,
    startDate,
    endDate,
    targetMonth,
    targetYear,
    isCurrentMonthView,
    customStart,
    customEnd,
  };
}

export default async function ItemLedgerPage({ params, searchParams }) {
  const { productId } = await params;
  const awaitedSearchParams = await searchParams;
  const filterConfig = getFilterConfig(awaitedSearchParams);

  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser) redirect("/");

  const [product, invoices, purchases, transferLogs, snapshots] =
    await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: {
          inventories: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: filterConfig.startDate,
            lte: filterConfig.endDate,
          },
        },
        include: {
          location: true,
          user: true,
          items: {
            where: {
              productId,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.purchase.findMany({
        where: {
          purchaseDate: {
            gte: filterConfig.startDate,
            lte: filterConfig.endDate,
          },
        },
        include: {
          location: true,
          user: true,
          items: {
            where: {
              productId,
            },
          },
        },
        orderBy: {
          purchaseDate: "asc",
        },
      }),
      prisma.transferLog.findMany({
        where: {
          productId,
          createdAt: {
            gte: filterConfig.startDate,
            lte: filterConfig.endDate,
          },
        },
        include: {
          fromLocation: true,
          toLocation: true,
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.stockSnapshot.findMany({
        where: {
          productId,
          month: filterConfig.targetMonth,
          year: filterConfig.targetYear,
        },
      }),
    ]);

  if (!product) notFound();

  const currentLiveStock = sumQuantity(product.inventories);

  const salesRows = invoices.flatMap((invoice) =>
    invoice.items.map((item) => ({
      date: invoice.createdAt,
      type: "SALE",
      reference: invoice.invoiceNumber,
      location: invoice.location?.name || "Unknown",
      qtyIn: 0,
      qtyOut: item.quantity,
      user: getUserLabel(invoice.user),
    })),
  );

  const purchaseRows = purchases.flatMap((purchase) =>
    purchase.items.map((item) => ({
      date: purchase.purchaseDate,
      type: "PURCHASE",
      reference: purchase.invoiceNumber,
      location: purchase.location?.name || "Unknown",
      qtyIn: item.quantity,
      qtyOut: 0,
      user: getUserLabel(purchase.user),
    })),
  );

  const transferRows = transferLogs.map((transfer) => ({
    date: transfer.createdAt,
    type: "TRANSFER",
    reference: `XFER-${transfer.id.slice(0, 8).toUpperCase()}`,
    location: `${transfer.fromLocation?.name || "Unknown"} → ${transfer.toLocation?.name || "Unknown"}`,
    qtyIn: transfer.quantity,
    qtyOut: transfer.quantity,
    user: getUserLabel(transfer.user),
  }));

  const timeline = [...salesRows, ...purchaseRows, ...transferRows].sort(
    (left, right) => new Date(right.date) - new Date(left.date),
  );

  const totalOut = sumQuantity(
    salesRows.map((row) => ({ quantity: row.qtyOut })),
  );
  const totalIn = sumQuantity(
    purchaseRows.map((row) => ({ quantity: row.qtyIn })),
  );
  const totalTransferred = sumQuantity(
    transferLogs.map((transfer) => ({ quantity: transfer.quantity })),
  );

  const openingStockFromSnapshots = sumQuantity(snapshots);
  const openingStockSource =
    snapshots.length > 0 ? "Static Snapshot" : "Dynamic Fallback";
  const openingStock =
    snapshots.length > 0
      ? openingStockFromSnapshots
      : currentLiveStock + totalOut - totalIn;

  const closingStock = filterConfig.isCurrentMonthView
    ? currentLiveStock
    : openingStock + totalIn - totalOut;

  const statCards = [
    {
      label: "Opening Stock",
      value: openingStock,
      note: openingStockSource,
      accent: "text-[#522874]",
      bg: "bg-purple-50",
    },
    {
      label: "Total In",
      value: totalIn,
      note: "Purchases in range",
      accent: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Out",
      value: totalOut,
      note: "Sales in range",
      accent: "text-rose-700",
      bg: "bg-rose-50",
    },
    {
      label: "Internal Transfers",
      value: totalTransferred,
      note: "Movement between shops",
      accent: "text-sky-700",
      bg: "bg-sky-50",
    },
    {
      label: filterConfig.isCurrentMonthView
        ? "Current Live Stock"
        : "Closing Stock",
      value: closingStock,
      note: filterConfig.isCurrentMonthView
        ? "Live inventory balance"
        : "Opening + In - Out",
      accent: "text-slate-800",
      bg: "bg-slate-50",
    },
  ];

  const selectedRangeLabel =
    filterConfig.selectedDateFilter === "this_month"
      ? format(filterConfig.startDate, "MMMM yyyy")
      : filterConfig.selectedDateFilter === "last_month"
        ? format(filterConfig.startDate, "MMMM yyyy")
        : `${format(filterConfig.startDate, "dd MMM yyyy")} to ${format(filterConfig.endDate, "dd MMM yyyy")}`;

  const formAction = `/inventory/${productId}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 px-4 md:px-8 pb-10 pt-24 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-[#522874]/30 hover:text-[#522874] transition-colors"
          >
            <ChevronLeft size={16} /> Back to Inventory
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#522874]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#522874]">
            <CalendarDays size={14} /> {selectedRangeLabel}
          </span>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#522874]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#522874]">
                <Package size={14} /> Item Ledger
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                  {product.modelName}
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-500 font-medium">
                  {product.brand} · {product.size} · SKU {product.sku}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Product
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  {product.modelName}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Size
                </div>
                <div className="mt-1 font-semibold text-gray-900">
                  {product.size}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200 sm:col-span-2">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  SKU
                </div>
                <div className="mt-1 font-mono font-semibold text-[#522874]">
                  {product.sku}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm px-4 md:px-5 py-4">
          <form method="get" action={formAction} className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                  Date Filter
                </label>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="date"
                    defaultValue={filterConfig.selectedDateFilter}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-10 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#522874]/40 focus:bg-white focus:ring-4 focus:ring-[#522874]/10"
                  >
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {filterConfig.selectedDateFilter === "custom" ? (
                <>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="start"
                      defaultValue={filterConfig.customStart}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#522874]/40 focus:bg-white focus:ring-4 focus:ring-[#522874]/10"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="end"
                      defaultValue={filterConfig.customEnd}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#522874]/40 focus:bg-white focus:ring-4 focus:ring-[#522874]/10"
                    />
                  </div>
                </>
              ) : null}

              <div className="flex items-center gap-3 lg:ml-auto">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-[#522874] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#3f1f57] active:scale-[0.99]"
                >
                  Apply
                </button>
                <Link
                  href={`/inventory/${productId}`}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <RotateCcw size={14} className="mr-2" /> Reset
                </Link>
              </div>
            </div>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border border-gray-200 ${card.bg} p-5 shadow-sm`}
            >
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                {card.label}
              </div>
              <div className={`mt-3 text-3xl font-black ${card.accent}`}>
                {card.value}
              </div>
              <div className="mt-2 text-sm text-gray-600">{card.note}</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">
              Unified Timeline
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sales, purchases, and transfers for the selected period.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4 text-right">Qty In</th>
                  <th className="px-5 py-4 text-right">Qty Out</th>
                  <th className="px-5 py-4">User</th>
                </tr>
              </thead>
              <tbody>
                {timeline.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No activity found for the selected period.
                    </td>
                  </tr>
                ) : (
                  timeline.map((item, index) => {
                    const colorClasses =
                      item.type === "SALE"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : item.type === "PURCHASE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-sky-50 text-sky-700 border-sky-200";

                    return (
                      <tr
                        key={`${item.type}-${item.reference}-${index}`}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDateTime(item.date)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${colorClasses}`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {item.reference}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.location}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700">
                          {item.qtyIn ?? 0}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-bold text-rose-700">
                          {item.qtyOut ?? 0}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.user}
                        </td>
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

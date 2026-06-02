import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

function getCurrentMonthWindow() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  return {
    month: monthIndex + 1,
    year,
    startDate: new Date(year, monthIndex, 1),
    endDate: new Date(year, monthIndex + 1, 1),
  };
}

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

export default async function ItemLedgerPage({ params }) {
  const { productId } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser) redirect("/");

  const { month, year, startDate, endDate } = getCurrentMonthWindow();

  const [product, invoices, purchases, transferLogs, snapshots] =
    await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: {
          inventories: {
            include: {
              location: true,
            },
          },
        },
      }),
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate,
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
            gte: startDate,
            lt: endDate,
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
            gte: startDate,
            lt: endDate,
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
          month,
          year,
        },
      }),
    ]);

  if (!product) notFound();

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
    })),
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
    })),
  );

  const monthlyTransfers = transferLogs.map((transfer) => ({
    date: transfer.createdAt,
    type: "TRANSFER",
    reference: `XFER-${transfer.id.slice(0, 8).toUpperCase()}`,
    location: `${transfer.fromLocation?.name || "Unknown"} → ${transfer.toLocation?.name || "Unknown"}`,
    qtyIn: transfer.quantity,
    qtyOut: transfer.quantity,
    user: getUserLabel(transfer.user),
  }));

  const timeline = [...monthlySales, ...monthlyPurchases, ...monthlyTransfers].sort(
    (left, right) => new Date(right.date) - new Date(left.date),
  );

  const salesOut = sumQuantity(monthlySales.map((item) => ({ quantity: item.qtyOut })));
  const purchasesIn = sumQuantity(monthlyPurchases.map((item) => ({ quantity: item.qtyIn })));
  const openingStockFromSnapshots = sumQuantity(snapshots);
  const openingStockSource =
    snapshots.length > 0 ? "Static Snapshot" : "Dynamic Fallback";
  const openingStock =
    snapshots.length > 0 ? openingStockFromSnapshots : currentLiveStock + salesOut - purchasesIn;

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
      value: purchasesIn,
      note: "Purchases this month",
      accent: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Out",
      value: salesOut,
      note: "Sales this month",
      accent: "text-rose-700",
      bg: "bg-rose-50",
    },
    {
      label: "Current Live Stock",
      value: currentLiveStock,
      note: "Live inventory balance",
      accent: "text-slate-800",
      bg: "bg-slate-50",
    },
  ];

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
            <CalendarDays size={14} />
            {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
              new Date(year, month - 1, 1),
            )}
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
                <div className="mt-1 font-semibold text-gray-900">{product.modelName}</div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Size
                </div>
                <div className="mt-1 font-semibold text-gray-900">{product.size}</div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200 sm:col-span-2">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  SKU
                </div>
                <div className="mt-1 font-mono font-semibold text-[#522874]">{product.sku}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border border-gray-200 ${card.bg} p-5 shadow-sm`}>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                {card.label}
              </div>
              <div className={`mt-3 text-3xl font-black ${card.accent}`}>{card.value}</div>
              <div className="mt-2 text-sm text-gray-600">{card.note}</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Unified Timeline</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sales, purchases, and transfers for the current month.
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
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No activity found for this month.
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
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${colorClasses}`}>
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
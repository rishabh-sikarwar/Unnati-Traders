import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: clerkUser.id },
      include: { location: true },
    });

    const locations = await prisma.location.findMany({
      select: { id: true, name: true },
    });

    // --- 1. PARSE FILTERS FROM URL ---
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days")) || 30;
    const urlLocationId = searchParams.get("locationId");

    let locationId;

    if (user?.role !== "ADMIN") {
      locationId = user?.locationId;
    } else if (urlLocationId) {
      locationId = urlLocationId;
    } else if (user?.locationId) {
      locationId = user.locationId;
    } else {
      locationId = "ALL";
    }

    // Calculate the cutoff date
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Build the dynamic WHERE clauses
    const dateFilter = { gte: cutoffDate };
    const locationFilter = locationId !== "ALL" ? { locationId } : {};

    const baseWhere = {
      createdAt: dateFilter,
      ...locationFilter,
    };

    // --- 2. GLOBAL METRICS (Filtered) ---
    const sales = await prisma.invoice.aggregate({
      _sum: { grandTotal: true },
      where: { status: "COMPLETED", ...baseWhere },
    });

    const purchases = await prisma.purchase.aggregate({
      _sum: { totalAmount: true },
      where: {
        ...baseWhere,
        items: { some: {} },
      },
    });

    const orders = await prisma.invoice.count({
      where: { status: "COMPLETED", ...baseWhere },
    });

    // Stock ignores the date filter, but respects the location filter!
    const stock = await prisma.inventory.aggregate({
      _sum: { quantity: true },
      where: locationId !== "ALL" ? { locationId } : {},
    });

    // --- 3. REVENUE VS PURCHASES (Bar Chart) ---
    // We keep the 6-month visual structure, but strictly filter the data by Location
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: monthFormatter.format(d),
        year: d.getFullYear(),
      };
    }).reverse();

    const monthlyDataMap = {};
    last6Months.forEach(({ month }) => {
      monthlyDataMap[month] = { month, sales: 0, purchases: 0 };
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentInvoices = await prisma.invoice.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: sixMonthsAgo },
        ...locationFilter,
      },
      select: { grandTotal: true, createdAt: true },
    });
    recentInvoices.forEach((inv) => {
      const month = monthFormatter.format(new Date(inv.createdAt));
      if (monthlyDataMap[month]) monthlyDataMap[month].sales += inv.grandTotal;
    });

    const recentPurchases = await prisma.purchase.findMany({
      where: { 
        createdAt: { gte: sixMonthsAgo }, 
        ...locationFilter,
        items: { some: {} },
      },
      select: { totalAmount: true, createdAt: true },
    });
    recentPurchases.forEach((pur) => {
      const month = monthFormatter.format(new Date(pur.createdAt));
      if (monthlyDataMap[month])
        monthlyDataMap[month].purchases += pur.totalAmount;
    });

    const salesData = Object.values(monthlyDataMap);

    // --- 4. DYNAMIC CATEGORY DATA (Pie Chart - Filtered) ---
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: { invoice: { status: "COMPLETED", ...baseWhere } },
      include: { product: { select: { category: true } } },
    });

    const categoryRevenueMap = {};
    invoiceItems.forEach((item) => {
      const rawCategory = item.product.category || "GENERAL";
      const cleanCategory = rawCategory
        .replace(/_/g, " ")
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));

      categoryRevenueMap[cleanCategory] =
        (categoryRevenueMap[cleanCategory] || 0) + item.totalPrice;
    });

    let categoryData = Object.keys(categoryRevenueMap)
      .map((key) => ({ name: key, value: categoryRevenueMap[key] }))
      .sort((a, b) => b.value - a.value);

    if (categoryData.length > 5) {
      const top5 = categoryData.slice(0, 5);
      const othersValue = categoryData
        .slice(5)
        .reduce((sum, cat) => sum + cat.value, 0);
      top5.push({ name: "Other", value: othersValue });
      categoryData = top5;
    }

    return NextResponse.json({
      summary: {
        totalSales: sales._sum.grandTotal || 0,
        totalPurchases: purchases._sum.totalAmount || 0,
        totalOrders: orders,
        totalStock: stock._sum.quantity || 0,
      },
      salesData,
      categoryData,
      user,
      defaultLocationId: locationId,
      locations,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}

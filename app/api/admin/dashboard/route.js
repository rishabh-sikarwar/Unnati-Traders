import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. GLOBAL METRICS
    const sales = await prisma.invoice.aggregate({
      _sum: { grandTotal: true },
      where: { status: "COMPLETED" },
    });

    const purchases = await prisma.purchase.aggregate({
      _sum: { totalAmount: true },
    });

    const orders = await prisma.invoice.count({
      where: { status: "COMPLETED" },
    });
    const stock = await prisma.inventory.aggregate({
      _sum: { quantity: true },
    });

    // 2. REVENUE VS PURCHASES (Last 6 Months Logic)
    // Generate the last 6 months array to ensure the chart is always full, even with 0 sales
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
      };
    }).reverse();

    const monthlyDataMap = {};
    last6Months.forEach(({ month }) => {
      monthlyDataMap[month] = { month, sales: 0, purchases: 0 };
    });

    // Fetch and map Sales
    const recentInvoices = await prisma.invoice.findMany({
      where: { status: "COMPLETED" },
      select: { grandTotal: true, createdAt: true },
    });
    recentInvoices.forEach((inv) => {
      const month = new Date(inv.createdAt).toLocaleString("default", {
        month: "short",
      });
      if (monthlyDataMap[month]) monthlyDataMap[month].sales += inv.grandTotal;
    });

    // Fetch and map Purchases
    const recentPurchases = await prisma.purchase.findMany({
      select: { totalAmount: true, createdAt: true },
    });
    recentPurchases.forEach((pur) => {
      const month = new Date(pur.createdAt).toLocaleString("default", {
        month: "short",
      });
      if (monthlyDataMap[month])
        monthlyDataMap[month].purchases += pur.totalAmount;
    });

    const salesData = Object.values(monthlyDataMap);

    // 3. DYNAMIC CATEGORY DATA (Revenue per Category)
    // Fetch all items from completed invoices, including their product's category
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: { invoice: { status: "COMPLETED" } },
      include: { product: { select: { category: true } } },
    });

    // Aggregate revenue by category
    const categoryRevenueMap = {};
    invoiceItems.forEach((item) => {
      // Convert ENUM like "TWO_WHEELER" to readable "Two Wheeler"
      const rawCategory = item.product.category || "GENERAL";
      const cleanCategory = rawCategory
        .replace(/_/g, " ")
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));

      categoryRevenueMap[cleanCategory] =
        (categoryRevenueMap[cleanCategory] || 0) + item.totalPrice;
    });

    // Convert map to array, sort highest to lowest
    let categoryData = Object.keys(categoryRevenueMap)
      .map((key) => ({
        name: key,
        value: categoryRevenueMap[key],
      }))
      .sort((a, b) => b.value - a.value);

    // If there are more than 5 categories, bundle the rest into "Other" to keep the pie chart clean
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
        totalPurchases: purchases._sum.totalAmount || 0, // Now dynamic!
        totalOrders: orders,
        totalStock: stock._sum.quantity || 0,
      },
      salesData,
      categoryData,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}

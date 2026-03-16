import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TOTAL REVENUE (Only sum up COMPLETED invoices using the strict Enum)
    const sales = await prisma.invoice.aggregate({
      _sum: { grandTotal: true },
      where: { status: "COMPLETED" },
    });

    const orders = await prisma.invoice.count();
    const stock = await prisma.inventory.aggregate({
      _sum: { quantity: true },
    });

    const users = await prisma.user.count();
    const shops = await prisma.location.count();
    const products = await prisma.product.count();

    // ----------------------------------------------------
    // FIX: Properly group sales by month for the Bar Chart
    // ----------------------------------------------------
    const invoices = await prisma.invoice.findMany({
      where: { status: "COMPLETED" },
      select: { grandTotal: true, createdAt: true },
    });

    const monthlySalesMap = {};
    invoices.forEach((inv) => {
      // Formats date to "Jan", "Feb", etc.
      const month = new Date(inv.createdAt).toLocaleString("default", {
        month: "short",
      });
      monthlySalesMap[month] = (monthlySalesMap[month] || 0) + inv.grandTotal;
    });

    // Convert the map back into an array for Recharts
    const salesData = Object.keys(monthlySalesMap).map((month) => ({
      month,
      sales: monthlySalesMap[month],
      purchases: 0, // Ready for future purchase logic
    }));

    // CATEGORY DATA (Demo data for the Pie Chart)
    const categoryData = [
      { name: "Car Tyres", value: 45 },
      { name: "Bike Tyres", value: 25 },
      { name: "Truck Tyres", value: 30 },
    ];

    return NextResponse.json({
      summary: {
        totalSales: sales._sum.grandTotal || 0,
        totalPurchases: 0,
        totalOrders: orders,
        totalStock: stock._sum.quantity || 0,
        totalUsers: users,
        totalShops: shops,
        totalProducts: products,
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

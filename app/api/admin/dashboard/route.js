import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TOTAL REVENUE
    const sales = await prisma.invoice.aggregate({
      _sum: { grandTotal: true },
    });

    // TOTAL ORDERS
    const orders = await prisma.invoice.count();

    // TOTAL STOCK
    const stock = await prisma.inventory.aggregate({
      _sum: { quantity: true },
    });

    // TOTAL USERS
    const users = await prisma.user.count();

    // TOTAL SHOPS
    const shops = await prisma.location.count();

    // PRODUCTS
    const products = await prisma.product.count();

    // BASIC SALES DATA (for chart demo)
    const invoices = await prisma.invoice.findMany({
      select: {
        grandTotal: true,
        createdAt: true,
      },
    });

    const salesData = invoices.map((inv) => ({
      month: new Date(inv.createdAt).toLocaleString("default", {
        month: "short",
      }),
      sales: inv.grandTotal,
      purchases: 0,
    }));

    // CATEGORY DATA (example tyre categories)
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
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}

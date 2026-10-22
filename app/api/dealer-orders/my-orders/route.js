import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.dealerOrder.findMany({
      where: {
        userId: clerkUser.id,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            code: true,
            upiId: true,
            upiQrUrl: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                modelName: true,
                brand: true,
                size: true,
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            amountPaid: true,
            status: true,
            createdAt: true,
            paymentMode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const serializedOrders = orders.map((order) => {
      const totalTyres = order.items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        notes: order.notes,
        paymentReference: order.paymentReference || null,
        paymentSubmittedAt: order.paymentSubmittedAt || null,
        createdAt: order.createdAt,
        totalTyres,
        location: order.location,
        itemsCount: order.items.length,
        items: order.items,
        invoice: order.invoice
          ? {
              ...order.invoice,
              grandTotal: Number(order.invoice.grandTotal),
              amountPaid: Number(order.invoice.amountPaid),
            }
          : null,
      };
    });

    const totalBookings = await prisma.dealerOrder.count({
      where: {
        userId: clerkUser.id,
        status: { not: "CANCELLED" },
      },
    });

    const billedInvoices = await prisma.dealerOrder.count({
      where: {
        userId: clerkUser.id,
        status: {
          in: ["BILLED", "PAYMENT_SUBMITTED", "COMPLETED"],
          not: "CANCELLED",
        },
      },
    });

    const pendingOrders = await prisma.dealerOrder.count({
      where: {
        userId: clerkUser.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      orders: serializedOrders,
      stats: {
        totalBookings,
        billedInvoices,
        pendingOrders,
      },
    });
  } catch (error) {
    console.error("Failed to fetch my orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.dealerOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        location: true,
        items: {
          include: {
            product: {
              include: {
                inventories: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Dealer order not found." },
        { status: 404 }
      );
    }

    const targetLocationId = order.locationId;

    const formattedItems = order.items.map((item) => {
      const shopInv = item.product.inventories.find(
        (inv) => inv.locationId === targetLocationId
      );
      return {
        id: item.id,
        productId: item.productId,
        modelName: item.product.modelName,
        size: item.product.size,
        brand: item.product.brand,
        requestedQuantity: item.quantity,
        actualShopStock: shopInv ? shopInv.quantity : 0,
        inventoryId: shopInv ? shopInv.id : null,
      };
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        notes: order.notes,
        paymentReference: order.paymentReference || null,
        paymentSubmittedAt: order.paymentSubmittedAt || null,
        locationId: order.locationId,
        location: order.location,
        customer: order.customer
          ? {
              id: order.customer.id,
              name: order.customer.name,
              phone: order.customer.phone || "",
              email: order.customer.email || "",
              address: order.customer.address || "",
              gstNumber: order.customer.gstNumber || "",
            }
          : {
              id: null,
              name: order.user?.fullName || "Wholesale Dealer",
              phone: order.user?.mobile || "",
              email: order.user?.email || "",
              address: "",
              gstNumber: "",
            },
        items: formattedItems,
      },
    });
  } catch (error) {
    console.error("Fetch dealer order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dealer order details." },
      { status: 500 }
    );
  }
}

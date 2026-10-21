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

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER")) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    const order = await prisma.dealerOrder.findUnique({
      where: { id },
      include: {
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
    const shortages = [];
    const itemsCheck = [];

    for (const item of order.items) {
      const shopInv = item.product?.inventories?.find(
        (inv) => inv.locationId === targetLocationId
      );
      const stockQty = shopInv ? shopInv.quantity : 0;
      const reqQty = item.quantity;

      const itemResult = {
        id: item.id,
        productId: item.productId,
        modelName: item.product?.modelName || "Tyre",
        size: item.product?.size || "",
        brand: item.product?.brand || "",
        requestedQuantity: reqQty,
        actualShopStock: stockQty,
        shortage: Math.max(0, reqQty - stockQty),
      };

      itemsCheck.push(itemResult);

      if (reqQty > stockQty) {
        shortages.push(itemResult);
      }
    }

    return NextResponse.json({
      success: true,
      hasShortage: shortages.length > 0,
      shortages,
      items: itemsCheck,
    });
  } catch (error) {
    console.error("Check stock API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check stock" },
      { status: 500 }
    );
  }
}

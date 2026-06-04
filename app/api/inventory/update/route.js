import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, locationId, quantity, type } = await req.json();
    const qtyNum = Number(quantity);

    // 1. Fetch current inventory to verify stock levels
    const existingStock = await prisma.inventory.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });

    const currentQty = existingStock ? existingStock.quantity : 0;

    // 2. Strict Negative Stock Check
    if (type === "remove" && qtyNum > currentQty) {
      return NextResponse.json(
        { error: `Cannot remove ${qtyNum}. Only ${currentQty} in stock.` },
        { status: 400 },
      );
    }

    const change = type === "add" ? qtyNum : -qtyNum;

    // 3. Execute transaction safely
    const [updated] = await prisma.$transaction([
      prisma.inventory.upsert({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        update: {
          quantity: {
            increment: change,
          },
        },
        create: {
          productId,
          locationId,
          quantity: change,
        },
      }),
      prisma.stockAdjustmentLog.create({
        data: {
          productId,
          locationId,
          quantityChange: change,
          type: type.toUpperCase(), // "ADD" or "REMOVE"
          userId: clerkUser.id,
        },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Stock update API error:", error);
    return NextResponse.json({ error: "Stock update failed" }, { status: 500 });
  }
}

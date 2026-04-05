import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      invoiceNumber,
      supplierName,
      locationId,
      items,
      totalAmount,
      userId,
    } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Purchase Record
      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierName: supplierName || "Apollo Tyres",
          totalAmount,
          locationId,
          userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
            })),
          },
        },
      });

      // 2. Add the physical stock to the specific Location
      for (const item of items) {
        await tx.inventory.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: locationId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            productId: item.productId,
            locationId: locationId,
            quantity: item.quantity,
          },
        });
      }

      return purchase;
    });

    return NextResponse.json({ success: true, purchaseId: result.id });
  } catch (error) {
    console.error("Purchase Error:", error);
    return NextResponse.json(
      { error: "Failed to record purchase and inward stock" },
      { status: 400 },
    );
  }
}

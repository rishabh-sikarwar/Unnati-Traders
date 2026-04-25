import { prisma } from "@/lib/prisma";
import { maxTime } from "date-fns/constants";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const body = await req.json();
    let {
      invoiceNumber,
      supplierName,
      locationId,
      purchaseDate,
      items,
      totalAmount,
      userId,
    } = body;

    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const dbUser = await prisma.user.findUnique({ where: { id: clerkUser.id } });
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dbUser.role === "SHOPKEEPER") locationId = dbUser.locationId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Purchase Record
      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierName: supplierName || "Apollo Tyres",
          totalAmount,
          locationId,
          userId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
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
    }, {
      maxTime: 5000, // Set a maximum time for the transaction to prevent hanging,
      timeout: 20000,
    } );

    return NextResponse.json({ success: true, purchaseId: result.id });
  } catch (error) {
    console.error("Purchase Error:", error);
    return NextResponse.json(
      { error: "Failed to record purchase and inward stock" },
      { status: 400 },
    );
  }
}

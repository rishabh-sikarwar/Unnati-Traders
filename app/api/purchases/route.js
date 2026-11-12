import { prisma } from "@/lib/prisma";
import { maxTime } from "date-fns/constants";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { toDecimal, moneyToString } from "@/lib/money";

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

    // Calculate backend exactTotal from items, apply ceiling function to totalAmount
    const exactTotal = items.reduce((sum, item) => {
      return sum.plus(toDecimal(item.totalCost));
    }, toDecimal(0));
    totalAmount = exactTotal.ceil();

    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });
    if (!dbUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dbUser.role === "SHOPKEEPER") locationId = dbUser.locationId;

    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create the Purchase Record
        const purchase = await tx.purchase.create({
          data: {
            invoiceNumber,
            supplierName: supplierName || "Apollo Tyres",
            totalAmount: moneyToString(totalAmount),
            locationId,
            userId,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: moneyToString(item.unitCost),
                totalCost: moneyToString(item.totalCost),
                includeTube: Boolean(item.includeTube),
                tubeName: item.includeTube ? (item.tubeName || null) : null,
                tubePrice: item.includeTube && item.tubePrice ? moneyToString(item.tubePrice) : 0,
                includeFlap: Boolean(item.includeFlap),
                flapName: item.includeFlap ? (item.flapName || null) : null,
                flapPrice: item.includeFlap && item.flapPrice ? moneyToString(item.flapPrice) : 0,
              })),
            },
          },
        });

        // 2. Add the physical stock to the specific Location & sync master product TTF settings
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

          // Fetch current product to check existing TTF configuration
          const currentProduct = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              hasTube: true,
              tubeName: true,
              tubePrice: true,
              hasFlap: true,
              flapName: true,
              flapPrice: true,
            },
          });

          const productUpdates = { isArchived: false };

          // Sync with Master Product: If item.includeTube or item.includeFlap was enabled during inward entry,
          // also update the corresponding Product record so the tyre is automatically ready for TTF set billing
          if (item.includeTube) {
            productUpdates.hasTube = true;
            if (item.tubeName) {
              productUpdates.tubeName = item.tubeName;
            }
            if (!currentProduct?.tubePrice || Number(currentProduct.tubePrice) === 0) {
              if (item.tubePrice && Number(item.tubePrice) > 0) {
                productUpdates.tubePrice = moneyToString(item.tubePrice);
              }
            }
          }

          if (item.includeFlap) {
            productUpdates.hasFlap = true;
            if (item.flapName) {
              productUpdates.flapName = item.flapName;
            }
            if (!currentProduct?.flapPrice || Number(currentProduct.flapPrice) === 0) {
              if (item.flapPrice && Number(item.flapPrice) > 0) {
                productUpdates.flapPrice = moneyToString(item.flapPrice);
              }
            }
          }

          await tx.product.update({
            where: { id: item.productId },
            data: productUpdates,
          });
        }

        return purchase;
      },
      {
        maxTime: 5000, // Set a maximum time for the transaction to prevent hanging,
        timeout: 20000,
      },
    );

    return NextResponse.json({ success: true, purchaseId: result.id });
  } catch (error) {
    console.error("Purchase Error:", error);
    return NextResponse.json(
      { error: "Failed to record purchase and inward stock" },
      { status: 400 },
    );
  }
}

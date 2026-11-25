import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admins only" },
        { status: 403 },
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const purchaseId = resolvedParams.id;

    // 1. Fetch the purchase and its items (Read-only query before transaction)
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });

    if (!purchase)
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 },
      );

    // 2. Perform cascade delete inside a transaction to ensure data integrity
    await prisma.$transaction(
      async (tx) => {
        // A. Reverse Inventory (Subtract the tyres that were added by this purchase)
        for (const item of purchase.items) {
          await tx.inventory.upsert({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: purchase.locationId,
              },
            },
            update: {
              quantity: { decrement: item.quantity },
            },
            create: {
              productId: item.productId,
              locationId: purchase.locationId,
              quantity: -item.quantity,
            },
          });
        }

        // B. Delete the purchase items
        await tx.purchaseItem.deleteMany({
          where: { purchaseId: purchaseId },
        });

        // C. Delete the purchase record itself
        await tx.purchase.delete({
          where: { id: purchaseId },
        });
      },
      {
        maxWait: 10000, // 10 seconds max wait to acquire connection
        timeout: 20000, // 20 seconds max execution time
      },
    );

    return NextResponse.json({
      success: true,
      message: "Purchase cancelled and stock reversed.",
    });
  } catch (error) {
    console.error("Delete Purchase API Error:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase record" },
      { status: 500 },
    );
  }
}

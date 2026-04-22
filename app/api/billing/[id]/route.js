import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoiceId = (await params).id;

    // 1. Fetch the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // 2. Perform cascade delete inside a transaction
    await prisma.$transaction(async (tx) => {
      // a. Restore Inventory
      // Only restore inventory if it's not a generic CUSTOMER fallback location.
      if (invoice.locationId) {
        for (const item of invoice.items) {
          // Check if inventory record mapping exists
          const inv = await tx.inventory.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: invoice.locationId,
              },
            },
          });

          // If mapping exists, increment count back.
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }
      }

      // b. Delete PaymentLogs related to this invoice
      if (invoice.customerId) {
        await tx.paymentLog.deleteMany({
          where: {
            customerId: invoice.customerId,
            remarks: { contains: invoice.invoiceNumber },
          },
        });
      }

      // c. Delete Invoice Items before deleting invoice itself.
      // (Even though cascade delete is usually on, it's safer to explicitly delete elements in Supabase connected Prisma).
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: invoiceId },
      });

      // d. Finally Delete the Invoice itself
      await tx.invoice.delete({
        where: { id: invoiceId },
      });
    });

    return NextResponse.json({ success: true, message: "Invoice cancelled and stock restored." });
  } catch (error) {
    console.error("Cancel Invoice API Error:", error);
    return NextResponse.json({ error: "Failed to cancel invoice" }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function DELETE(req, { params }) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoiceId = (await params).id;

    // 1. Fetch the invoice and items (Read-only query before transaction)
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // 2. Check for linked DealerOrder before transaction (Read-only query before transaction)
    const linkedOrder = await prisma.dealerOrder.findFirst({
      where: { invoiceId: invoiceId },
      select: { id: true },
    });
    const cancelledDealerOrderId = linkedOrder ? linkedOrder.id : null;

    // 3. Perform cascade delete inside an atomic transaction with explicit timeout
    await prisma.$transaction(
      async (tx) => {
        // a. Restore Inventory
        // Only restore inventory if it's not a generic CUSTOMER fallback location.
        if (invoice.locationId && invoice.items?.length > 0) {
          for (const item of invoice.items) {
            await tx.inventory.upsert({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: invoice.locationId,
                },
              },
              update: {
                quantity: { increment: item.quantity },
              },
              create: {
                productId: item.productId,
                locationId: invoice.locationId,
                quantity: item.quantity,
              },
            });
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

        // c. Mark linked DealerOrder as CANCELLED (unlinking invoiceId)
        if (cancelledDealerOrderId) {
          await tx.dealerOrder.update({
            where: { id: cancelledDealerOrderId },
            data: {
              status: "CANCELLED",
              invoiceId: null,
            },
          });
        }

        // d. Delete Invoice Items before deleting invoice itself.
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: invoiceId },
        });

        // e. Finally Delete the Invoice itself
        await tx.invoice.delete({
          where: { id: invoiceId },
        });
      },
      {
        maxWait: 10000, // 10 seconds max wait to acquire connection
        timeout: 20000, // 20 seconds max execution time
      }
    );

    // 4. Cache Invalidation - Forcefully clear Next.js caches
    revalidatePath("/dashboard");
    revalidatePath("/orders");
    revalidatePath("/orders/dealer-requests");
    if (cancelledDealerOrderId) {
      revalidatePath(`/store/orders/${cancelledDealerOrderId}`);
    }

    return NextResponse.json({
      success: true,
      message: "Invoice cancelled, stock restored, and linked dealer order marked as CANCELLED.",
    });
  } catch (error) {
    console.error("Cancel Invoice API Error:", error);
    return NextResponse.json({ error: "Failed to cancel invoice" }, { status: 500 });
  }
}

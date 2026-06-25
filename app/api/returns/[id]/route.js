import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // 1. Authorize Admin
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    // 2. Fetch the ReturnLog
    const returnLog = await prisma.returnLog.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!returnLog) {
      return NextResponse.json({ error: "Return record not found." }, { status: 404 });
    }

    // 3. Execute Reversal in a transaction
    await prisma.$transaction(async (tx) => {
      // A. Revert Inventory (if it was GOOD and restocked)
      if (returnLog.condition === "GOOD") {
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: returnLog.productId,
              locationId: returnLog.locationId,
            },
          },
        });

        if (inventory) {
          await tx.inventory.update({
            where: {
              productId_locationId: {
                productId: returnLog.productId,
                locationId: returnLog.locationId,
              },
            },
            data: {
              quantity: {
                decrement: returnLog.quantity,
              },
            },
          });
        }
      }

      // B. Locate and delete corresponding PaymentLog (Credit Note)
      // The credit note payment log was created with mode 'RETURN_CREDIT' and a specific remarks string
      const suffix = returnLog.id.slice(-6);
      const paymentLog = await tx.paymentLog.findFirst({
        where: {
          customerId: returnLog.customerId,
          paymentMode: "RETURN_CREDIT",
          remarks: {
            startsWith: `Credit Note for Return ID: ${suffix}`,
          },
        },
      });

      if (paymentLog) {
        await tx.paymentLog.delete({
          where: { id: paymentLog.id },
        });
      }

      // C. Update/Touch Customer record to trigger updates
      // Note: Because Khata balance is dynamic (Invoices - Payments), deleting the credit note PaymentLog
      // automatically increases the dynamic outstanding balance by the return log's refund amount.
      // We touch the customer record here within the transaction as requested.
      await tx.customer.update({
        where: { id: returnLog.customerId },
        data: {
          name: returnLog.customer.name, // dummy update to touch
        },
      });

      // D. Delete the ReturnLog
      await tx.returnLog.delete({
        where: { id: returnLog.id },
      });
    });

    return NextResponse.json({ success: true, message: "Return reversed and database updated successfully." });
  } catch (error) {
    console.error("Error reversing return:", error);
    return NextResponse.json(
      { error: "Failed to reverse return." },
      { status: 500 }
    );
  }
}

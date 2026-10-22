import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
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
        { error: "Forbidden: Only Admin or Shopkeepers can verify payments and complete dealer orders." },
        { status: 403 }
      );
    }

    const order = await prisma.dealerOrder.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Dealer order not found." },
        { status: 404 }
      );
    }

    // Shopkeepers can only complete orders fulfilled for their assigned branch
    if (dbUser.role === "SHOPKEEPER" && dbUser.locationId !== order.locationId) {
      return NextResponse.json(
        { error: "Forbidden: You can only complete orders for your assigned shop branch." },
        { status: 403 }
      );
    }

    // Update status to COMPLETED
    const updatedOrder = await prisma.dealerOrder.update({
      where: { id },
      data: {
        status: "COMPLETED",
      },
      include: {
        invoice: true,
      },
    });

    // If an invoice is linked, update its payment / status if tracked
    if (order.invoiceId && order.invoice) {
      const invoiceData = { status: "COMPLETED" };
      if (Number(order.invoice.amountPaid || 0) < Number(order.invoice.grandTotal || 0)) {
        invoiceData.amountPaid = order.invoice.grandTotal;
      }
      await prisma.invoice.update({
        where: { id: order.invoiceId },
        data: invoiceData,
      });
    }

    // Step 4: Refresh & Cache Purge
    revalidatePath("/dashboard");
    revalidatePath("/orders/dealer-requests");
    revalidatePath(`/store/orders/${id}`);
    revalidatePath("/orders");

    return NextResponse.json({
      success: true,
      message: "Payment confirmed & order marked completed!",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error marking dealer order as completed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark order as completed." },
      { status: 500 }
    );
  }
}

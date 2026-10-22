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

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const order = await prisma.dealerOrder.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Dealer order not found." },
        { status: 404 }
      );
    }

    // Verify user owns the order (or is Admin)
    const isOwner =
      order.userId === dbUser.id ||
      (order.customer && order.customer.clerkUserId === clerkUser.id);
    if (!isOwner && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You cannot submit payment for another dealer's order." },
        { status: 403 }
      );
    }

    let paymentReference = "";
    try {
      const body = await req.json();
      paymentReference = body.paymentReference || body.utrNumber || "";
    } catch {
      // Body may be empty if no payload was sent
    }

    // Update status to PAYMENT_SUBMITTED
    const updatedOrder = await prisma.dealerOrder.update({
      where: { id },
      data: {
        status: "PAYMENT_SUBMITTED",
        paymentReference: paymentReference?.trim() || null,
        paymentSubmittedAt: new Date(),
      },
    });

    // Invalidate caches
    revalidatePath("/dashboard");
    revalidatePath("/orders/dealer-requests");
    revalidatePath(`/store/orders/${id}`);
    revalidatePath("/orders");

    return NextResponse.json({
      success: true,
      message: "Payment confirmation submitted. The shopkeeper has been notified.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Submit payment API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit payment confirmation." },
      { status: 500 }
    );
  }
}

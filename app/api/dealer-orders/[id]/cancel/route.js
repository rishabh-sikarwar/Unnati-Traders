import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function handleCancelOrder(req, { params }) {
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
        { error: "Forbidden: Only Admin or Shopkeepers can cancel dealer bookings." },
        { status: 403 }
      );
    }

    const order = await prisma.dealerOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Dealer order not found." },
        { status: 404 }
      );
    }

    // Shopkeeper can only cancel orders assigned to their branch
    if (dbUser.role === "SHOPKEEPER" && dbUser.locationId !== order.locationId) {
      return NextResponse.json(
        { error: "Forbidden: You can only reject orders for your assigned shop branch." },
        { status: 403 }
      );
    }

    // Update status to CANCELLED
    const updatedOrder = await prisma.dealerOrder.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    // Invalidate caches
    revalidatePath("/orders/dealer-requests");
    revalidatePath("/dashboard");
    revalidatePath("/orders");
    revalidatePath(`/store/orders/${id}`);

    return NextResponse.json({
      success: true,
      message: "Order booking rejected and marked as cancelled.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Cancel dealer order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel order" },
      { status: 500 }
    );
  }
}

export { handleCancelOrder as PATCH, handleCancelOrder as POST };

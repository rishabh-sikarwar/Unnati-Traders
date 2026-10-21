import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

    return NextResponse.json({
      success: true,
      message: "Order marked as completed successfully.",
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

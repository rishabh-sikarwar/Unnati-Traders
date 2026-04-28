import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerIds, amount } = await req.json();

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { error: "At least one customer id is required" },
        { status: 400 },
      );
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: "Opening balance must be a valid non-negative number" },
        { status: 400 },
      );
    }

    // For grouped duplicate names, keep legacy due on a single profile to avoid accidental double counting.
    const primaryCustomerId = customerIds[0];

    await prisma.$transaction(async (tx) => {
      await tx.customer.updateMany({
        where: { id: { in: customerIds } },
        data: { openingBalance: 0 },
      });

      await tx.customer.update({
        where: { id: primaryCustomerId },
        data: { openingBalance: parsedAmount },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set Opening Balance Error:", error);
    return NextResponse.json(
      { error: "Failed to set opening balance" },
      { status: 500 },
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { customerIds, isArchived = true } = await req.json();

    if (!customerIds || !Array.isArray(customerIds)) {
      return NextResponse.json(
        { error: "Customer IDs are required" },
        { status: 400 },
      );
    }

    // Soft delete or restore: update isArchived flag
    await prisma.customer.updateMany({
      where: { id: { in: customerIds } },
      data: { isArchived: Boolean(isArchived) },
    });

    return NextResponse.json({ success: true, isArchived: Boolean(isArchived) });
  } catch (error) {
    console.error("Archive/Restore Error:", error);
    return NextResponse.json(
      { error: "Failed to update customer status" },
      { status: 500 },
    );
  }
}

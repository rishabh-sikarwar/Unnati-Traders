import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Soft delete: We just hide them, we NEVER actually delete them!
    await prisma.customer.update({
      where: { id: customerId },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive Error:", error);
    return NextResponse.json(
      { error: "Failed to archive customer" },
      { status: 500 },
    );
  }
}

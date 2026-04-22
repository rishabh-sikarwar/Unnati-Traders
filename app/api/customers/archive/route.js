import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { customerIds } = await req.json();

    if (!customerIds || !Array.isArray(customerIds)) {
      return NextResponse.json(
        { error: "Customer IDs are required" },
        { status: 400 },
      );
    }

    // Soft delete: We just hide them, we NEVER actually delete them!
    await prisma.customer.updateMany({
      where: { id: { in: customerIds } },
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

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const updated = await prisma.product.update({
      where: { id: body.id },
      data: {
        modelName: body.modelName,
        size: body.size,
        basePrice: parseFloat(body.basePrice),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Failed to update product details" },
      { status: 500 },
    );
  }
}

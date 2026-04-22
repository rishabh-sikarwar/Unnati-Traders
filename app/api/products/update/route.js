import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const updated = await prisma.product.update({
      where: { id: body.id },
      data: {
        sku: body.sku,
        modelName: body.modelName,
        size: body.size,
        basePrice: parseFloat(body.basePrice),
        category: body.category, // Added category support
        hsnCode: body.hsnCode,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Product update error:", error);
    // If the SKU already exists, Prisma will throw a unique constraint error
    return NextResponse.json(
      { error: "Failed to update product. Ensure the SKU is unique." },
      { status: 500 },
    );
  }
}

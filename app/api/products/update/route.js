import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { moneyToString } from "@/lib/money";

export async function POST(req) {
  try {
    const body = await req.json();

    const updated = await prisma.product.update({
      where: { id: body.id },
      data: {
        sku: body.sku,
        modelName: body.modelName,
        size: body.size,
        basePrice: moneyToString(body.basePrice),
        category: body.category, // Added category support
        hsnCode: body.hsnCode,
        hasTube: Boolean(body.hasTube),
        tubeName: body.hasTube ? (body.tubeName || null) : null,
        tubePrice: body.hasTube && body.tubePrice ? moneyToString(body.tubePrice) : 0,
        hasFlap: Boolean(body.hasFlap),
        flapName: body.hasFlap ? (body.flapName || null) : null,
        flapPrice: body.hasFlap && body.flapPrice ? moneyToString(body.flapPrice) : 0,
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        ...updated,
        basePrice: Number(updated.basePrice),
        tubePrice: Number(updated.tubePrice || 0),
        flapPrice: Number(updated.flapPrice || 0),
      },
    });
  } catch (error) {
    console.error("Product update error:", error);
    // If the SKU already exists, Prisma will throw a unique constraint error
    return NextResponse.json(
      { error: "Failed to update product. Ensure the SKU is unique." },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  return POST(req);
}

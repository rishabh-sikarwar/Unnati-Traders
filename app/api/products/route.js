import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all unique products and include their inventory arrays to calculate total stock later
    const products = await prisma.product.findMany({
      include: { inventories: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch catalogue" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Create the new tyre in the catalogue.
    // Notice we do NOT create any inventory/shop records here!
    const newProduct = await prisma.product.create({
      data: {
        sku: body.sku,
        modelName: body.modelName,
        size: body.size,
        category: body.category || "TWO_WHEELER",
        basePrice: parseFloat(body.basePrice),
        brand: "Apollo",
        gstRate: 28,
      },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Could not add tyre. Check if SKU already exists." },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();

    // Prisma's 'onDelete: Cascade' in your schema will automatically
    // wipe out any associated Inventory records when the Product is deleted.
    await prisma.product.delete({
      where: { id: body.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product permanently." },
      { status: 500 },
    );
  }
}

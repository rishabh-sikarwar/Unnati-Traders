import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all unique products and include their inventory arrays to calculate total stock later
    const products = await prisma.product.findMany({
      where: { isArchived: false },
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
        hsnCode: body.hsnCode || "4011",
        isArchived: false,
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
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can remove tyres from the catalogue." },
        { status: 403 },
      );
    }

    const body = await req.json();

    const product = await prisma.product.findUnique({
      where: { id: body.id },
      include: { inventories: true, invoiceItems: true, purchaseItems: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Tyre not found" }, { status: 404 });
    }

    const activeStock = product.inventories.reduce(
      (sum, inventory) => sum + (Number(inventory.quantity) || 0),
      0,
    );

    if (activeStock > 0) {
      return NextResponse.json(
        {
          error:
            "This tyre still has active stock. Reduce the stock to zero before removing it from the catalogue.",
        },
        { status: 400 },
      );
    }

    await prisma.product.update({
      where: { id: body.id },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Failed to remove tyre from catalogue." },
      { status: 500 },
    );
  }
}

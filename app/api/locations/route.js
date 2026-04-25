import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Create the location (type must match the uppercase LocationType Enum)
    const location = await prisma.location.create({
      data: {
        name: body.name,
        address: body.address,
        type: body.type.toUpperCase(), // Ensures enum matching (e.g., 'WAREHOUSE')
      },
    });

    // 2. CRITICAL FIX: Initialize this new shop with 0 stock for all existing products
    const products = await prisma.product.findMany({ select: { id: true } });

    if (products.length > 0) {
      await prisma.inventory.createMany({
        data: products.map((p) => ({
          productId: p.id,
          locationId: location.id,
          quantity: 0,
        })),
      });
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error("Create location error:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();

    // FIX: Only block deletion if there is actual physical stock (> 0) sitting in the shop
    const activeInventory = await prisma.inventory.findFirst({
      where: {
        locationId: body.id,
        quantity: { gt: 0 },
      },
    });

    if (activeInventory) {
      return NextResponse.json(
        { error: "Cannot delete! This shop still has physical stock." },
        { status: 400 },
      );
    }

    // It's safe to delete. Prisma's 'onDelete: Cascade' will wipe out the 0-quantity rows.
    await prisma.location.delete({
      where: { id: body.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete location error:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, address } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "Shop ID and Name are required" },
        { status: 400 },
      );
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        name,
        address,
        // Note: We intentionally do not update the 'type' (Warehouse vs Retail)
        // to prevent breaking existing business logic rules associated with that shop type.
      },
    });

    return NextResponse.json({ success: true, location: updatedLocation });
  } catch (error) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "Failed to update location details" },
      { status: 500 },
    );
  }
}
// app/api/inventory/route.js

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
        location: true,
      },
      orderBy: {
        product: {
          modelName: "asc",
        },
      },
    });

    const serialized = inventory.map((inv) => ({
      ...inv,
      product: inv.product
        ? {
            ...inv.product,
            basePrice: Number(inv.product.basePrice),
            tubePrice: Number(inv.product.tubePrice || 0),
            flapPrice: Number(inv.product.flapPrice || 0),
          }
        : null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

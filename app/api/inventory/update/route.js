// app/api/inventory/update/route.js

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { productId, locationId, quantity, type } = await req.json();

    const change = type === "add" ? quantity : -quantity;

    const updated = await prisma.inventory.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      update: {
        quantity: {
          increment: change,
        },
      },
      create: {
        productId,
        locationId,
        quantity: change,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Stock update failed" }, { status: 500 });
  }
}

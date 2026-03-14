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
        lastUpdated: "desc",
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

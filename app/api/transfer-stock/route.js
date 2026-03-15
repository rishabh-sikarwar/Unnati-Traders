import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { productId, fromLocation, toLocation, quantity } = await req.json();

    if (!productId || !fromLocation || !toLocation || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const source = await tx.inventory.findUnique({
        where: {
          productId_locationId: {
            productId,
            locationId: fromLocation,
          },
        },
      });

      if (!source || source.quantity < quantity) {
        throw new Error("Not enough stock in source shop");
      }

      // remove from source
      await tx.inventory.update({
        where: {
          productId_locationId: {
            productId,
            locationId: fromLocation,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      // add to destination
      await tx.inventory.update({
        where: {
          productId_locationId: {
            productId,
            locationId: toLocation,
          },
        },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

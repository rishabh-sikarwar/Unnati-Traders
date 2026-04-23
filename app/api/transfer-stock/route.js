import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    let { productId, fromLocation, toLocation, quantity } = await req.json();

    const clerkUser = await currentUser();
    if (!clerkUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const dbUser = await prisma.user.findUnique({ where: { id: clerkUser.id } });
    if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (dbUser.role === "SHOPKEEPER" && fromLocation !== dbUser.locationId) {
      return NextResponse.json({ error: "You can only transfer stock from your own shop." }, { status: 403 });
    }


    if (!productId || !fromLocation || !toLocation || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Check Source Shop
      const source = await tx.inventory.findUnique({
        where: {
          productId_locationId: { productId, locationId: fromLocation },
        },
      });

      if (!source || source.quantity < quantity) {
        throw new Error("Not enough stock in source shop");
      }

      // 2. Remove from Source
      await tx.inventory.update({
        where: {
          productId_locationId: { productId, locationId: fromLocation },
        },
        data: { quantity: { decrement: quantity } },
      });

      // 3. Add to Destination
      await tx.inventory.upsert({
        where: { productId_locationId: { productId, locationId: toLocation } },
        update: { quantity: { increment: quantity } },
        create: { productId, locationId: toLocation, quantity },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

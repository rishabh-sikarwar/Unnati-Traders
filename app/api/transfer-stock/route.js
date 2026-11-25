import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const body = await req.json();
    let { productId, fromLocation, toLocation, quantity, unitPrice, notes, items } = body;

    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });
    if (!dbUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (dbUser.role === "SHOPKEEPER" && fromLocation !== dbUser.locationId) {
      return NextResponse.json(
        { error: "You can only transfer stock from your own shop." },
        { status: 403 },
      );
    }

    if (!fromLocation || !toLocation) {
      return NextResponse.json(
        { error: "Source and destination shops are required" },
        { status: 400 },
      );
    }

    if (fromLocation === toLocation) {
      return NextResponse.json(
        { error: "Source and destination shop cannot be the same" },
        { status: 400 },
      );
    }

    // Normalize items array: support both items[] or single (productId, quantity, unitPrice)
    let transferItems = [];
    if (Array.isArray(items) && items.length > 0) {
      transferItems = items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice || 0),
      }));
    } else if (productId && quantity) {
      transferItems = [
        {
          productId,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice || 0),
        },
      ];
    } else {
      return NextResponse.json(
        { error: "Missing tyre or quantity for transfer" },
        { status: 400 },
      );
    }

    // Validate quantities & prices
    for (const it of transferItems) {
      if (!it.productId || it.quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid product or quantity specified" },
          { status: 400 },
        );
      }
      if (it.unitPrice < 0) {
        return NextResponse.json(
          { error: "Transfer rate cannot be negative" },
          { status: 400 },
        );
      }
    }

    const createdTransfer = await prisma.$transaction(async (tx) => {
      // 1. Generate sequential transfer challan number (e.g. TRF-2026-0001)
      const currentYear = new Date().getFullYear();
      const prefix = `TRF-${currentYear}-`;
      const latestTransfer = await tx.stockTransfer.findFirst({
        where: { transferNumber: { startsWith: prefix } },
        orderBy: { transferNumber: "desc" },
      });

      let nextSeq = 1;
      if (latestTransfer?.transferNumber) {
        const parts = latestTransfer.transferNumber.split("-");
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num)) {
          nextSeq = num + 1;
        }
      }
      const transferNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;

      // 2. Validate stock and perform movements for each item
      let totalWorth = 0;
      for (const it of transferItems) {
        const itemTotal = it.quantity * it.unitPrice;
        totalWorth += itemTotal;

        // Check source stock
        const source = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: it.productId,
              locationId: fromLocation,
            },
          },
          include: { product: true },
        });

        if (!source || source.quantity < it.quantity) {
          const prodName = source?.product?.modelName || "selected tyre";
          throw new Error(
            `Insufficient stock for "${prodName}". Available at source: ${source ? source.quantity : 0}, requested: ${it.quantity}`,
          );
        }

        // Decrement from source shop
        await tx.inventory.update({
          where: {
            productId_locationId: {
              productId: it.productId,
              locationId: fromLocation,
            },
          },
          data: { quantity: { decrement: it.quantity } },
        });

        // Upsert into destination shop
        await tx.inventory.upsert({
          where: {
            productId_locationId: {
              productId: it.productId,
              locationId: toLocation,
            },
          },
          update: { quantity: { increment: it.quantity } },
          create: {
            productId: it.productId,
            locationId: toLocation,
            quantity: it.quantity,
          },
        });

        // Backward compatibility: create TransferLog for product ledger
        await tx.transferLog.create({
          data: {
            productId: it.productId,
            fromLocationId: fromLocation,
            toLocationId: toLocation,
            quantity: it.quantity,
            userId: dbUser.id,
          },
        });
      }

      // 3. Create Valued StockTransfer record with items (WITHOUT touching Purchase)
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          fromLocationId: fromLocation,
          toLocationId: toLocation,
          totalWorth,
          notes: notes?.trim() || null,
          userId: dbUser.id,
          items: {
            create: transferItems.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalValue: it.quantity * it.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  modelName: true,
                  size: true,
                  sku: true,
                  hsnCode: true,
                  hasTube: true,
                  tubeName: true,
                  hasFlap: true,
                  flapName: true,
                },
              },
            },
          },
          fromLocation: true,
          toLocation: true,
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });

      return transfer;
    }, {
      maxWait: 10000, // 10 seconds max wait to acquire connection
      timeout: 20000, // 20 seconds max execution time
    });

    const serializedTransfer = {
      ...createdTransfer,
      totalWorth: Number(createdTransfer.totalWorth),
      items: createdTransfer.items.map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        totalValue: Number(it.totalValue),
      })),
    };

    return NextResponse.json({
      success: true,
      transfer: serializedTransfer,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const toLocationId = searchParams.get("toLocationId");
    const fromLocationId = searchParams.get("fromLocationId");

    const where = {};
    if (toLocationId) where.toLocationId = toLocationId;
    if (fromLocationId) where.fromLocationId = fromLocationId;

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        fromLocation: true,
        toLocation: true,
        user: { select: { fullName: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                modelName: true,
                size: true,
                sku: true,
                hsnCode: true,
                hasTube: true,
                tubeName: true,
                hasFlap: true,
                flapName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = transfers.map((t) => ({
      ...t,
      totalWorth: Number(t.totalWorth),
      items: t.items.map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        totalValue: Number(it.totalValue),
      })),
    }));

    return NextResponse.json({ success: true, transfers: serialized });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

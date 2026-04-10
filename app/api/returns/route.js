import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { customerId, productId, locationId, quantity, refundAmount, condition, reason, userId } = await req.json();

    if (!customerId || !productId || !locationId || quantity <= 0) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Log the Return
      const returnLog = await tx.returnLog.create({
        data: {
          customerId, productId, locationId, userId,
          quantity: Number(quantity),
          refundAmount: Number(refundAmount),
          condition,
          reason,
        }
      });

      // 2. Issue a Credit Note to the Customer's Khata
      // By adding a payment log with RETURN_CREDIT, it automatically reduces their outstanding dues!
      await tx.paymentLog.create({
        data: {
          customerId, userId,
          amount: Number(refundAmount),
          paymentMode: "RETURN_CREDIT",
          remarks: `Credit Note for Return ID: ${returnLog.id.slice(-6)} - ${reason || condition}`,
        }
      });

      // 3. Return to Inventory (ONLY if condition is GOOD)
      if (condition === "GOOD") {
        await tx.inventory.upsert({
          where: { productId_locationId: { productId, locationId } },
          update: { quantity: { increment: Number(quantity) } },
          create: { productId, locationId, quantity: Number(quantity) }
        });
      }

      return returnLog;
    });

    return NextResponse.json({ success: true, returnId: result.id });
  } catch (error) {
    console.error("Return Error:", error);
    return NextResponse.json({ error: "Failed to process return." }, { status: 500 });
  }
}
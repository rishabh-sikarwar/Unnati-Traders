import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { customerId, amount, paymentMode, remarks, userId } =
      await req.json();

    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment details" },
        { status: 400 },
      );
    }

    // Record the payment log
    const payment = await prisma.paymentLog.create({
      data: {
        amount: parseFloat(amount),
        paymentMode: paymentMode,
        remarks: remarks || null,
        customerId: customerId,
        userId: userId || null,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Payment Log Error:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}

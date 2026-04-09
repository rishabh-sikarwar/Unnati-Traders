import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month"));
    const year = parseInt(searchParams.get("year"));

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 });
    }

    // Calculate the first and last day of the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
        location: true,
      },
      orderBy: { createdAt: "asc" }, // Oldest to newest for proper ledger ordering
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GST Report Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "monthly").toLowerCase();
    const month = parseInt(searchParams.get("month"));
    const year = parseInt(searchParams.get("year"));
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    const now = new Date();
    let startDate;
    let endDate;
    let periodLabel = "Monthly";

    if (period === "last_3_months") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      periodLabel = "Last 3 Months";
    } else if (period === "last_1_year") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      periodLabel = "Last 1 Year";
    } else if (period === "custom") {
      if (!startParam || !endParam) {
        return NextResponse.json(
          { error: "Start and end dates are required for custom range" },
          { status: 400 },
        );
      }

      startDate = new Date(startParam);
      endDate = new Date(endParam);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid custom date range" },
          { status: 400 },
        );
      }

      // Normalize custom range to full days.
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = "Custom Range";
    } else {
      // Default monthly mode.
      if (isNaN(month) || isNaN(year)) {
        return NextResponse.json(
          { error: "Invalid month/year parameters" },
          { status: 400 },
        );
      }
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
      periodLabel = "Monthly";
    }

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

    const purchases = await prisma.purchase.findMany({
      where: {
        status: "COMPLETED",
        purchaseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        location: true,
      },
      orderBy: { purchaseDate: "asc" },
    });

    return NextResponse.json({
      invoices,
      purchases,
      period: {
        type: period,
        label: periodLabel,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("GST Report Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}

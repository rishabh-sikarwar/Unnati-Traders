import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

async function writeSnapshot({ month, year, replaceExisting }) {
  const inventory = await prisma.inventory.findMany({
    select: {
      productId: true,
      locationId: true,
      quantity: true,
    },
  });

  if (replaceExisting) {
    await prisma.stockSnapshot.deleteMany({
      where: {
        month,
        year,
      },
    });
  }

  const result = await prisma.stockSnapshot.createMany({
    data: inventory.map((record) => ({
      productId: record.productId,
      locationId: record.locationId,
      quantity: record.quantity,
      month,
      year,
    })),
    skipDuplicates: !replaceExisting,
  });

  return {
    attempted: inventory.length,
    created: result.count,
  };
}

export async function GET(request) {
  try {
    const vercelCronHeader = request.headers.get("x-vercel-cron");
    if (process.env.NODE_ENV === "production" && vercelCronHeader !== "1") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const result = await writeSnapshot({
      month,
      year,
      replaceExisting: false,
    });

    return NextResponse.json({
      success: true,
      month,
      year,
      attempted: result.attempted,
      created: result.created,
    });
  } catch (error) {
    console.error("Snapshot stock cron failed:", error);
    return NextResponse.json(
      { error: "Failed to create stock snapshot" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await writeSnapshot({
      month,
      year,
      replaceExisting: true,
    });

    return NextResponse.json({
      success: true,
      month,
      year,
      attempted: result.attempted,
      created: result.created,
    });
  } catch (error) {
    console.error("Manual snapshot update failed:", error);
    return NextResponse.json(
      { error: "Failed to update opening stock snapshot" },
      { status: 500 },
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const updated = await prisma.user.update({
      where: {
        id: body.userId,
      },
      data: {
        mobile: body.mobile || null,
        role: body.role, // Save the new strict role directly to Prisma
        locationId: body.locationId || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
  }
}

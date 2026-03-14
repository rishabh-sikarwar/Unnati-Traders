import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  const updated = await prisma.user.update({
    where: {
      id: body.userId,
    },

    data: {
      mobile: body.mobile,
      locationId: body.locationId || null,
    },
  });

  return NextResponse.json(updated);
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  const updated = await prisma.product.update({
    where: { id: body.id },
    data: {
      modelName: body.modelName,
      size: body.size,
      basePrice: body.basePrice,
    },
  });

  return NextResponse.json(updated);
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const locations = await prisma.location.findMany();

  return NextResponse.json(locations);
}

export async function POST(req) {
  const body = await req.json();

  const location = await prisma.location.create({
    data: {
      name: body.name,
      address: body.address,
      type: body.type,
    },
  });

  return NextResponse.json(location);
}

export async function DELETE(req) {
    const body = await req.json();
    
    const inventory = await prisma.inventory.findFirst({
      where: { locationId: body.id },
    });

    if (inventory) {
      return NextResponse.json(
        { error: "Shop contains inventory" },
        { status: 400 },
      );
    }

  await prisma.location.delete({
    where: {
      id: body.id,
    },
  });

  return NextResponse.json({ success: true });
}
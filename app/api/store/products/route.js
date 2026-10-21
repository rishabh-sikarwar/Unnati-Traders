import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = (searchParams.get("search") || searchParams.get("q") || "").trim();

    const whereClause = {
      isArchived: false,
    };

    if (searchQuery) {
      whereClause.OR = [
        { modelName: { contains: searchQuery, mode: "insensitive" } },
        { size: { contains: searchQuery, mode: "insensitive" } },
        { brand: { contains: searchQuery, mode: "insensitive" } },
        { sku: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: [
        { brand: "asc" },
        { modelName: "asc" },
      ],
      select: {
        id: true,
        sku: true,
        brand: true,
        modelName: true,
        size: true,
        category: true,
        tubeType: true,
        description: true,
      },
    });

    const serializedProducts = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      brand: p.brand,
      name: p.modelName,
      model: p.modelName,
      modelName: p.modelName,
      size: p.size,
      category: p.category,
      tubeType: p.tubeType,
      description: p.description,
    }));

    return NextResponse.json({ success: true, products: serializedProducts });
  } catch (error) {
    console.error("Store products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

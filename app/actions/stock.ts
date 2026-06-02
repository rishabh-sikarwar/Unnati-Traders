"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { moneyToString } from "@/lib/money";

export async function addTyreProduct(formData) {
  try {
    const sku = formData.get("sku");
    const modelName = formData.get("modelName");
    const size = formData.get("size");
    const basePrice = moneyToString(formData.get("basePrice"));

    // fetch all locations
    const locations = await prisma.location.findMany();

    await prisma.product.create({
      data: {
        sku,
        modelName,
        size,
        basePrice,
        brand: "Apollo",
        gstRate: 28,

        inventories: {
          create: locations.map((loc) => ({
            locationId: loc.id,
            quantity: 0,
          })),
        },
      },
    });

    revalidatePath("/stock");
    revalidatePath("/inventory");

    return { success: true };
  } catch (error) {
    console.error("Failed to add product:", error);

    return {
      success: false,
      error: "Could not add tyre",
    };
  }
}

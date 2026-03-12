"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addTyreProduct(formData) {
  try {
    const sku = formData.get("sku");
    const modelName = formData.get("modelName");
    const size = formData.get("size");
    const basePrice = parseFloat(formData.get("basePrice"));

    // Insert the new tyre into the database
    await prisma.product.create({
      data: {
        sku,
        modelName,
        size,
        basePrice,
        brand: "Apollo", // Hardcoded since he is an Apollo distributor
        gstRate: 28, // Standard GST for tyres in India
      },
    });

    // This tells Next.js to refresh the page instantly to show the new data
    revalidatePath("/stock");
    return { success: true };
  } catch (error) {
    console.error("Failed to add product:", error);
    return {
      success: false,
      error: "Could not add tyre. Check if SKU already exists.",
    };
  }
}

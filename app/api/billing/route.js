import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerInfo, items, locationId, userId, totals } = body;

    const result = await prisma.$transaction(async (tx) => {
      
      // Verify Stock Levels
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId_locationId: { productId: item.productId, locationId } },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.modelName}.`);
        }
      }

      // Create Customer
      const customer = await tx.customer.create({
        data: {
          type: customerInfo.b2b ? "SUB_DEALER" : "RETAIL",
          name: customerInfo.name || "Walk-in Customer",
          phone: customerInfo.phone || null,
          address: customerInfo.address || null, // GSTIN/Vehicle removed
        }
      });

      // Generate Invoice Number
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      // Create the Invoice using the manually calculated totals from the frontend
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          subtotal: totals.subtotal,       // This is the taxable value (after discount)
          totalGst: totals.totalGst,       // Manual CGST + SGST
          grandTotal: totals.grandTotal,   // Final Total
          status: "COMPLETED",
          customerId: customer.id,
          locationId: locationId,
          userId: userId,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            }))
          }
        }
      });

      // Deduct from Inventory
      for (const item of items) {
        await tx.inventory.update({
          where: { productId_locationId: { productId: item.productId, locationId } },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      return invoice;
    });

    return NextResponse.json({ success: true, invoiceId: result.id });

  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to process bill" }, { status: 400 });
  }
}
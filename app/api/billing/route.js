import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerInfo, items, locationId, userId, totals } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify Stock Levels
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_locationId: { productId: item.productId, locationId },
          },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.modelName}.`);
        }
      }

      // 2. Create Customer
      const customer = await tx.customer.create({
        data: {
          type: customerInfo.b2b ? "SUB_DEALER" : "RETAIL",
          name: customerInfo.name || "Walk-in Customer",
          phone: customerInfo.phone || null,
          address: customerInfo.address || null,
        },
      });

      // 3. Generate Invoice Number
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      // 4. Handle "Udhaar" Partial Payments
      const isCredit = customerInfo.paymentMode === "Credit";
      // If Udhaar, use the partial payment amount. Otherwise, they paid the full Grand Total.
      const actualAmountPaid = isCredit
        ? Number(customerInfo.initialPayment) || 0
        : totals.grandTotal;
      const modeEnum = customerInfo.paymentMode.toUpperCase();

      // 5. Create the Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          subtotal: totals.subtotal,
          totalGst: totals.totalGst,
          grandTotal: totals.grandTotal,
          paymentMode: modeEnum,
          amountPaid: actualAmountPaid, // FIXED: Changed from upfrontPayment to amountPaid
          status: "COMPLETED",
          customerId: customer.id,
          locationId: locationId,
          userId: userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: { location: true },
      });

      // 6. Deduct from Inventory
      for (const item of items) {
        await tx.inventory.update({
          where: {
            productId_locationId: { productId: item.productId, locationId },
          },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return invoice;
    });

    // --- ASYNCHRONOUS EMAIL NOTIFICATION ---
    const mailOptions = {
      from: `"Unnati Traders ERP" <${process.env.EMAIL_USER}>`,
      to: "binaybhadoria@gmail.com",
      subject: `New Sale Alert: ${result.invoiceNumber} (₹${result.grandTotal.toLocaleString()})`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-w: 600px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #522874;">New Invoice Generated</h2>
          <p><strong>Shop Location:</strong> ${result.location?.name || "Unknown Shop"}</p>
          <p><strong>Invoice Number:</strong> ${result.invoiceNumber}</p>
          <p><strong>Customer Name:</strong> ${customerInfo.name || "Walk-in Customer"}</p>
          <p><strong>Customer Phone:</strong> ${customerInfo.phone || "N/A"}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3 style="color: #10B981;">Grand Total: ₹${result.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <p style="font-size: 12px; color: #888;">Log into the ERP dashboard to view full invoice details.</p>
        </div>
      `,
    };

    transporter
      .sendMail(mailOptions)
      .catch((err) => console.error("Email failed to send:", err));

    return NextResponse.json({ success: true, invoiceId: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to process bill" },
      { status: 400 },
    );
  }
}

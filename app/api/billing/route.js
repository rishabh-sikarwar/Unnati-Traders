import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(req) {
  try {
    const { customerInfo, items, locationId, userId, totals } =
      await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify Stock
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_locationId: { productId: item.productId, locationId },
          },
        });
        if (!inventory || inventory.quantity < item.quantity)
          throw new Error(`Insufficient stock for ${item.modelName}.`);
      }

      // 2. Link or Create Customer
      let dbCustomer;
      if (customerInfo.id) {
        dbCustomer = await tx.customer.update({
          where: { id: customerInfo.id },
          data: {
            phone: customerInfo.phone || null,
            address: customerInfo.address || null,
            gstNumber: customerInfo.gstNumber || null,
          },
        });
      } else {
        dbCustomer = await tx.customer.create({
          data: {
            type: customerInfo.b2b ? "SUB_DEALER" : "RETAIL",
            name: customerInfo.name || "Walk-in Customer",
            phone: customerInfo.phone || null,
            address: customerInfo.address || null,
            gstNumber: customerInfo.gstNumber || null,
          },
        });
      }

      // 3. Generate Clean Invoice Number
      const invoiceNumber = `INV-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90) + 10}`;

      // 4. SMART PAYMENT LOGIC (Handles Splits!)
      const isCredit = customerInfo.paymentMode === "Credit";
      const isMultiple = customerInfo.paymentMode === "Multiple";
      let actualAmountPaid = totals.grandTotal;

      if (isCredit) {
        actualAmountPaid = Number(customerInfo.initialPayment) || 0;
      } else if (isMultiple) {
        const splits = customerInfo.splitPayments;
        actualAmountPaid =
          (Number(splits.cash) || 0) +
          (Number(splits.upi) || 0) +
          (Number(splits.card) || 0);
      }

      const modeEnum = isMultiple
        ? "MULTIPLE"
        : customerInfo.paymentMode.toUpperCase();

      // 5. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          subtotal: totals.subtotal,
          totalGst: totals.totalGst,
          grandTotal: totals.grandTotal,
          paymentMode: modeEnum,
          amountPaid: actualAmountPaid,
          status: "COMPLETED",
          customerId: dbCustomer.id,
          locationId,
          userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              tyreCode: item.tyreCode || null,
            })),
          },
        },
        include: { location: true },
      });

      // 6. Create Detailed Payment Logs for CA!
      if (isMultiple) {
        const splits = customerInfo.splitPayments;
        if (Number(splits.cash) > 0)
          await tx.paymentLog.create({
            data: {
              amount: Number(splits.cash),
              paymentMode: "CASH",
              customerId: dbCustomer.id,
              userId,
              remarks: `Split Payment for ${invoiceNumber}`,
            },
          });
        if (Number(splits.upi) > 0)
          await tx.paymentLog.create({
            data: {
              amount: Number(splits.upi),
              paymentMode: "UPI",
              customerId: dbCustomer.id,
              userId,
              remarks: `Split Payment for ${invoiceNumber}`,
            },
          });
        if (Number(splits.card) > 0)
          await tx.paymentLog.create({
            data: {
              amount: Number(splits.card),
              paymentMode: "CARD",
              customerId: dbCustomer.id,
              userId,
              remarks: `Split Payment for ${invoiceNumber}`,
            },
          });
      } else if (actualAmountPaid > 0) {
        // Standard single payment log
        await tx.paymentLog.create({
          data: {
            amount: actualAmountPaid,
            paymentMode: modeEnum === "CREDIT" ? "CASH" : modeEnum,
            customerId: dbCustomer.id,
            userId,
            remarks: `Payment for ${invoiceNumber}`,
          },
        });
      }

      // 7. Deduct Inventory
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
    const receiptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://unnati-traders.vercel.app"}/billing/receipt/${result.id}`;

    const mailOptions = {
      from: `"Unnati Traders ERP" <${process.env.EMAIL_USER}>`,
      to: [
        "binaybhadoria@gmail.com",
        "neeluchouhan222@gmail.com",
        "rishabhsikarwar200@gmail.com",
      ],
      subject: `New Sale Alert: ${result.invoiceNumber} (₹${result.grandTotal.toLocaleString()})`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #522874;">New Invoice Generated</h2>
          <p><strong>Shop Location:</strong> ${result.location?.name || "Unknown Shop"}</p>
          <p><strong>Invoice Number:</strong> ${result.invoiceNumber}</p>
          <p><strong>Customer Name:</strong> ${customerInfo.name || "Walk-in Customer"}</p>
          <p><strong>Customer Phone:</strong> ${customerInfo.phone || "N/A"}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3 style="color: #10B981;">Grand Total: ₹${result.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <div style="margin-top: 20px; text-align: center;">
            <a
              href="${receiptUrl}"
              style="display: inline-block; background-color: #522874; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;"
            >
              🧾 View Full Receipt
            </a>
          </div>
          <p style="font-size: 11px; color: #aaa; margin-top: 16px; text-align: center;">This link is accessible without login and can be shared with the customer.</p>
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

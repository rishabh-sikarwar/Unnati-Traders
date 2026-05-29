import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { formatNumber } from "@/lib/format";
import { currentUser } from "@clerk/nextjs/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Helper: Calculate Indian Financial Year (April 1 to March 31)
// Returns format like "25-26"
function getFiscalYearLabel(date = new Date()) {
  const startYear =
    date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
}

export async function POST(req) {
  try {
    let { customerInfo, items, locationId, userId, totals } = await req.json();

    // --- 1. AUTHORIZATION ---
    const clerkUser = await currentUser();
    if (!clerkUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });
    if (!dbUser)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (dbUser.role === "SHOPKEEPER") locationId = dbUser.locationId;

    // --- 2. GET SHOP PREFIX ---
    const billingLocation = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, name: true, code: true },
    });

    if (!billingLocation) {
      return NextResponse.json(
        { error: "Invalid billing location" },
        { status: 400 },
      );
    }

    const shopCode = billingLocation.code || "UT";
    const fiscalYearLabel = getFiscalYearLabel();

    // --- 3. RETRY LOOP FOR SAFE INVOICE GENERATION ---
    let result = null;
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        result = await prisma.$transaction(
          async (tx) => {
            // A. Verify Stock
            for (const item of items) {
              const inventory = await tx.inventory.findUnique({
                where: {
                  productId_locationId: {
                    productId: item.productId,
                    locationId,
                  },
                },
              });

              if (!inventory || inventory.quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${item.modelName}.`);
              }
            }

            // B. Link or Create Customer
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

            // C. Smart Payment Logic (Splits)
            const isCredit = customerInfo.paymentMode === "Credit";
            const isMultiple = customerInfo.paymentMode === "Multiple";
            let actualAmountPaid = totals.grandTotal;
            let splitCash = 0;
            let splitUpi = 0;
            let splitCard = 0;

            if (isCredit) {
              actualAmountPaid = Number(customerInfo.initialPayment) || 0;
              splitCash = actualAmountPaid;
            } else if (isMultiple) {
              const splits = customerInfo.splitPayments;
              splitCash = Number(splits.cash) || 0;
              splitUpi = Number(splits.upi) || 0;
              splitCard = Number(splits.card) || 0;
              actualAmountPaid = splitCash + splitUpi + splitCard;
            } else {
              const normalizedMode = customerInfo.paymentMode.toUpperCase();
              if (normalizedMode === "CASH") splitCash = actualAmountPaid;
              if (normalizedMode === "UPI") splitUpi = actualAmountPaid;
              if (normalizedMode === "CARD") splitCard = actualAmountPaid;
            }

            const modeEnum = isMultiple
              ? "MULTIPLE"
              : customerInfo.paymentMode.toUpperCase();

            // ==========================================
            // D. SAFE SEQUENCE GENERATOR (MAX METHOD)
            // ==========================================
            const prefix = `${shopCode}/${fiscalYearLabel}/`; // e.g., BHD/25-26/

            const lastInvoice = await tx.invoice.findFirst({
              where: {
                invoiceNumber: { startsWith: prefix },
              },
              orderBy: { createdAt: "desc" },
              select: { invoiceNumber: true },
            });

            let nextSequence = 1;
            if (lastInvoice) {
              // Extract the number from "BHD/25-26/0004" -> "0004" -> 4
              const lastNum = parseInt(
                lastInvoice.invoiceNumber.split("/").pop(),
                10,
              );
              if (!isNaN(lastNum)) {
                nextSequence = lastNum + 1;
              }
            }

            const invoiceNumber = `${prefix}${String(nextSequence).padStart(4, "0")}`;
            // ==========================================

            // E. Create Invoice
            const invoice = await tx.invoice.create({
              data: {
                invoiceNumber,
                subtotal: totals.subtotal,
                totalGst: totals.totalGst,
                grandTotal: totals.grandTotal,
                paymentMode: modeEnum,
                amountPaid: actualAmountPaid,
                splitCash,
                splitUpi,
                splitCard,
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

            // F. Create Payment Logs
            if (isMultiple) {
              const splits = customerInfo.splitPayments;
              if (Number(splits.cash) > 0) {
                await tx.paymentLog.create({
                  data: {
                    amount: Number(splits.cash),
                    paymentMode: "CASH",
                    customerId: dbCustomer.id,
                    userId,
                    invoiceId: invoice.id,
                    remarks: `Split Payment for ${invoiceNumber}`,
                  },
                });
              }
              if (Number(splits.upi) > 0) {
                await tx.paymentLog.create({
                  data: {
                    amount: Number(splits.upi),
                    paymentMode: "UPI",
                    customerId: dbCustomer.id,
                    userId,
                    invoiceId: invoice.id,
                    remarks: `Split Payment for ${invoiceNumber}`,
                  },
                });
              }
              if (Number(splits.card) > 0) {
                await tx.paymentLog.create({
                  data: {
                    amount: Number(splits.card),
                    paymentMode: "CARD",
                    customerId: dbCustomer.id,
                    userId,
                    invoiceId: invoice.id,
                    remarks: `Split Payment for ${invoiceNumber}`,
                  },
                });
              }
            } else if (actualAmountPaid > 0) {
              await tx.paymentLog.create({
                data: {
                  amount: actualAmountPaid,
                  paymentMode: modeEnum === "CREDIT" ? "CASH" : modeEnum,
                  customerId: dbCustomer.id,
                  userId,
                  invoiceId: invoice.id,
                  remarks: `Payment for ${invoiceNumber}`,
                },
              });
            }

            // G. Deduct Inventory
            await Promise.all(
              items.map((item) =>
                tx.inventory.update({
                  where: {
                    productId_locationId: {
                      productId: item.productId,
                      locationId,
                    },
                  },
                  data: { quantity: { decrement: item.quantity } },
                }),
              ),
            );

            return invoice; // Return the successfully created invoice
          },
          { timeout: 15000 },
        );

        // If transaction succeeds, break out of the retry loop
        break;
      } catch (error) {
        // If two shops bill at the exact same second, retry.
        if (
          (error?.code === "P2002" || error?.code === "P2034") &&
          attempt < maxAttempts - 1
        ) {
          continue;
        }
        throw error; // If it's a different error, crash and show the user.
      }
    }

    if (!result) {
      throw new Error("Failed to generate a unique invoice number");
    }

    // --- 4. ASYNCHRONOUS EMAIL NOTIFICATION ---
    const receiptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://unnati-traders.vercel.app"}/billing/receipt/${result.id}`;

    const mailOptions = {
      from: `"Unnati Traders ERP" <${process.env.EMAIL_USER}>`,
      to: [
        "binaybhadoria@gmail.com",
        "neeluchouhan222@gmail.com",
        "rishabhsikarwar200@gmail.com",
      ],
      subject: `New Sale Alert: ${result.invoiceNumber} (₹${formatNumber(result.grandTotal, 2)})`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #522874;">New Invoice Generated</h2>
          <p><strong>Shop Location:</strong> ${result.location?.name || "Unknown Shop"}</p>
          <p><strong>Invoice Number:</strong> ${result.invoiceNumber}</p>
          <p><strong>Customer Name:</strong> ${customerInfo.name || "Walk-in Customer"}</p>
          <p><strong>Customer Phone:</strong> ${customerInfo.phone || "N/A"}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3 style="color: #10B981;">Grand Total: ₹${formatNumber(result.grandTotal, 2)}</h3>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${receiptUrl}" style="display: inline-block; background-color: #522874; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              🧾 View Full Receipt
            </a>
          </div>
        </div>
      `,
    };

    transporter
      .sendMail(mailOptions)
      .catch((err) => console.error("Email failed to send:", err));

    // Send successful response to browser
    return NextResponse.json({
      success: true,
      invoiceId: result.id,
      invoiceNumber: result.invoiceNumber,
      grandTotal: result.grandTotal,
    });
  } catch (error) {
    console.error("Billing Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process bill" },
      { status: 400 },
    );
  }
}

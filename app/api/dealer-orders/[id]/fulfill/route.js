import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { toDecimal, moneyToString } from "@/lib/money";

export const dynamic = "force-dynamic";

function getFiscalYearLabel(date = new Date()) {
  const startYear =
    date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER")) {
      return NextResponse.json(
        { error: "Forbidden. Only Admin and Shopkeepers can fulfill dealer orders." },
        { status: 403 }
      );
    }

    const order = await prisma.dealerOrder.findUnique({
      where: { id },
      include: {
        location: true,
        customer: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: `Order is already in ${order.status} state.` },
        { status: 400 }
      );
    }

    // If Shopkeeper, ensure order is for their assigned location
    if (dbUser.role === "SHOPKEEPER" && dbUser.locationId !== order.locationId) {
      return NextResponse.json(
        { error: "You can only fulfill orders for your assigned shop." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { items, paymentMode = "CREDIT", initialPayment = 0 } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Please provide item pricing details." },
        { status: 400 }
      );
    }

    // Ensure customer exists
    let customerId = order.customerId;
    if (!customerId) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { clerkUserId: order.userId },
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCust = await prisma.customer.create({
          data: {
            clerkUserId: order.userId,
            name: order.user?.fullName || "Wholesale Dealer",
            phone: order.user?.mobile || null,
            email: order.user?.email || null,
            type: "SUB_DEALER",
          },
        });
        customerId = newCust.id;
      }
    }

    // Execute atomic transaction with safe retries for collision avoidance
    const MAX_RETRIES = 3;
    let fulfilledInvoice = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        fulfilledInvoice = await prisma.$transaction(
          async (tx) => {
            // A. Check Stock
            for (const item of items) {
              const inv = await tx.inventory.findUnique({
                where: {
                  productId_locationId: {
                    productId: item.productId,
                    locationId: order.locationId,
                  },
                },
              });

              if (!inv || inv.quantity < item.quantity) {
                const prod = order.items.find((i) => i.productId === item.productId)?.product;
                throw new Error(
                  `Insufficient stock for ${prod?.modelName || "tyre"}. Available: ${inv?.quantity || 0}, Requested: ${item.quantity}`
                );
              }
            }

            // B. Calculate Totals (Subtotal, GST 28%, Grand Total)
            let subtotalDecimal = toDecimal(0);
            let totalGstDecimal = toDecimal(0);

            const calculatedItems = items.map((it) => {
              const qty = Number(it.quantity);
              // Unit price is base taxable amount per unit
              const unitRate = toDecimal(it.unitPrice);
              const lineSubtotal = unitRate.times(qty);
              const lineGst = lineSubtotal.times(0.28);

              subtotalDecimal = subtotalDecimal.plus(lineSubtotal);
              totalGstDecimal = totalGstDecimal.plus(lineGst);

              return {
                productId: item.productId,
                quantity: qty,
                unitPrice: unitRate,
                totalPrice: lineSubtotal.plus(lineGst),
              };
            });

            const grandTotalDecimal = subtotalDecimal.plus(totalGstDecimal).ceil();

            // C. Payment calculations
            const normalizedMode = paymentMode.toUpperCase();
            let actualAmountPaid = toDecimal(0);
            let splitCash = toDecimal(0);
            let splitUpi = toDecimal(0);

            if (normalizedMode === "CREDIT") {
              actualAmountPaid = toDecimal(initialPayment);
              splitCash = actualAmountPaid;
            } else if (normalizedMode === "CASH") {
              actualAmountPaid = grandTotalDecimal;
              splitCash = grandTotalDecimal;
            } else if (normalizedMode === "UPI") {
              actualAmountPaid = grandTotalDecimal;
              splitUpi = grandTotalDecimal;
            }

            // D. Collision-Free Invoice Sequence Generator
            const shopCode = order.location.code || "UT";
            const fiscalYearLabel = getFiscalYearLabel(new Date());
            const prefix = `${shopCode}/${fiscalYearLabel}/`;

            const existingInvoices = await tx.invoice.findMany({
              where: { invoiceNumber: { startsWith: prefix } },
              select: { invoiceNumber: true },
            });

            let maxSequence = 0;
            for (const inv of existingInvoices) {
              const parts = inv.invoiceNumber.split("/");
              const seqStr = parts[parts.length - 1];
              const seqNum = parseInt(seqStr, 10);
              if (!isNaN(seqNum) && seqNum > maxSequence) {
                maxSequence = seqNum;
              }
            }

            const nextSequence = maxSequence + 1;
            const invoiceNumber = `${prefix}${String(nextSequence).padStart(4, "0")}`;

            const isInterState = order.customer?.gstNumber && !order.customer.gstNumber.startsWith("23");
            const igstDecimal = isInterState ? totalGstDecimal : toDecimal(0);
            const cgstDecimal = isInterState ? toDecimal(0) : totalGstDecimal.div(2);
            const sgstDecimal = isInterState ? toDecimal(0) : totalGstDecimal.div(2);

            // E. Create Invoice
            const invoice = await tx.invoice.create({
              data: {
                invoiceNumber,
                subtotal: moneyToString(subtotalDecimal),
                cgstAmount: moneyToString(cgstDecimal),
                sgstAmount: moneyToString(sgstDecimal),
                igstAmount: moneyToString(igstDecimal),
                totalGst: moneyToString(totalGstDecimal),
                grandTotal: moneyToString(grandTotalDecimal),
                paymentMode: normalizedMode === "CREDIT" ? "CREDIT" : normalizedMode,
                amountPaid: moneyToString(actualAmountPaid),
                splitCash: moneyToString(splitCash),
                splitUpi: moneyToString(splitUpi),
                splitCard: moneyToString(0),
                status: "COMPLETED",
                customerId: customerId,
                locationId: order.locationId,
                userId: dbUser.id,
                items: {
                  create: calculatedItems.map((ci) => ({
                    productId: ci.productId,
                    quantity: ci.quantity,
                    unitPrice: moneyToString(ci.unitPrice),
                    totalPrice: moneyToString(ci.totalPrice),
                  })),
                },
              },
            });

            // F. Create Payment Log if upfront payment was made
            if (actualAmountPaid.gt(0)) {
              await tx.paymentLog.create({
                data: {
                  amount: moneyToString(actualAmountPaid),
                  paymentMode: normalizedMode === "CREDIT" ? "CASH" : normalizedMode,
                  customerId: customerId,
                  userId: dbUser.id,
                  invoiceId: invoice.id,
                  remarks: `Fulfillment payment for Dealer Order ${order.orderNumber} (${invoiceNumber})`,
                },
              });
            }

            // G. Decrement Inventory
            await Promise.all(
              items.map((item) =>
                tx.inventory.update({
                  where: {
                    productId_locationId: {
                      productId: item.productId,
                      locationId: order.locationId,
                    },
                  },
                  data: { quantity: { decrement: item.quantity } },
                })
              )
            );

            // H. Link to DealerOrder and update status to BILLED
            await tx.dealerOrder.update({
              where: { id: order.id },
              data: {
                status: "BILLED",
                invoiceId: invoice.id,
                customerId: customerId,
              },
            });

            return invoice;
          },
          { timeout: 15000 }
        );

        break; // Successfully committed transaction
      } catch (txError) {
        if (attempt === MAX_RETRIES - 1) throw txError;
        console.warn(`Retry attempt ${attempt + 1} for dealer order fulfillment...`);
      }
    }

    return NextResponse.json({
      success: true,
      invoiceId: fulfilledInvoice.id,
      invoiceNumber: fulfilledInvoice.invoiceNumber,
    });
  } catch (error) {
    console.error("Failed to fulfill dealer order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fulfill order." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (!dbUser) {
      const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress || null;
      const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Wholesale Buyer";
      dbUser = await prisma.user.create({
        data: {
          id: clerkUser.id,
          email: primaryEmail,
          fullName: fullName,
          role: "VISITOR",
        },
      });
    }

    const body = await req.json();
    const { locationId, items, notes } = body;

    if (!locationId) {
      return NextResponse.json({ error: "Please select a fulfilling shop." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your order cart is empty." }, { status: 400 });
    }

    // Validate shop exists
    const shop = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!shop) {
      return NextResponse.json({ error: "Selected shop does not exist." }, { status: 400 });
    }

    // 1. Ensure Customer record exists linked to clerkUserId
    let customer = await prisma.customer.findUnique({
      where: { clerkUserId: clerkUser.id },
    });

    if (!customer) {
      if (dbUser.mobile) {
        customer = await prisma.customer.findFirst({
          where: { phone: dbUser.mobile },
        });
      }

      if (customer) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            clerkUserId: clerkUser.id,
            email: customer.email || dbUser.email || null,
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            clerkUserId: clerkUser.id,
            name: dbUser.fullName || "Wholesale Dealer",
            phone: dbUser.mobile || null,
            email: dbUser.email || null,
            type: "SUB_DEALER",
          },
        });
      }
    }

    // 2. Generate Collision-free Order Number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20261014
    const shopPrefix = (shop.code || "UT").toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${shopPrefix}-${datePrefix}-${randomSuffix}`;

    // 3. Create DealerOrder in a transaction
    // B2B Indent / Backorder Policy:
    // We intentionally DO NOT validate requested quantities against current physical shop stock.
    // Dealers can order any tyre and any quantity. Stock validation and deduction occur
    // when the shopkeeper fulfills the order and generates the bill.
    const newOrder = await prisma.dealerOrder.create({
      data: {
        orderNumber,
        status: "PENDING",
        notes: notes ? String(notes).trim() : null,
        userId: dbUser.id,
        customerId: customer.id,
        locationId: shop.id,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 4. Role Elevation: If user is VISITOR, elevate to DEALER upon their first order
    if (dbUser.role === "VISITOR") {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: "DEALER" },
      });
    }

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
    });
  } catch (error) {
    console.error("Failed to place dealer order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to place order. Please try again." },
      { status: 500 }
    );
  }
}

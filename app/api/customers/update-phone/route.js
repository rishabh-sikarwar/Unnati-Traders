import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // 1. Fetch DB User
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
          mobile: cleanPhone,
          role: "VISITOR",
        },
      });
    } else {
      dbUser = await prisma.user.update({
        where: { id: clerkUser.id },
        data: { mobile: cleanPhone },
      });
    }

    // 2. Sync or link Customer record
    let customer = await prisma.customer.findUnique({
      where: { clerkUserId: clerkUser.id },
    });

    if (customer) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: cleanPhone },
      });
    } else {
      // Check if customer exists by phone
      customer = await prisma.customer.findFirst({
        where: { phone: cleanPhone },
      });

      if (customer) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            clerkUserId: clerkUser.id,
            email: customer.email || dbUser.email || null,
          },
        });
      } else {
        await prisma.customer.create({
          data: {
            clerkUserId: clerkUser.id,
            name: dbUser.fullName || "Wholesale Buyer",
            phone: cleanPhone,
            email: dbUser.email || null,
            type: "SUB_DEALER",
          },
        });
      }
    }

    return NextResponse.json({ success: true, phone: cleanPhone });
  } catch (error) {
    console.error("Failed to update phone number:", error);
    return NextResponse.json(
      { error: "Failed to update phone number. Please try again." },
      { status: 500 }
    );
  }
}

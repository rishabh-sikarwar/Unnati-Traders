import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { toDecimal, moneyToString } from "@/lib/money";

export async function POST(req) {
  try {
    // 1. Authorization Check
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 2. Parse request body
    const { primaryCustomerId, duplicateCustomerId } = await req.json();

    if (!primaryCustomerId || !duplicateCustomerId) {
      return NextResponse.json(
        { error: "Both primaryCustomerId and duplicateCustomerId are required." },
        { status: 400 }
      );
    }

    if (primaryCustomerId === duplicateCustomerId) {
      return NextResponse.json(
        { error: "Primary and duplicate customers cannot be the same." },
        { status: 400 }
      );
    }

    // 3. Prisma Transaction to safely merge customer records
    const result = await prisma.$transaction(async (tx) => {
      // A. Fetch both profiles to make sure they exist
      const primaryCustomer = await tx.customer.findUnique({
        where: { id: primaryCustomerId },
      });
      const duplicateCustomer = await tx.customer.findUnique({
        where: { id: duplicateCustomerId },
      });

      if (!primaryCustomer || !duplicateCustomer) {
        throw new Error("One or both customer accounts could not be found.");
      }

      // B. Merge opening balances
      const primaryBal = toDecimal(primaryCustomer.openingBalance || 0);
      const duplicateBal = toDecimal(duplicateCustomer.openingBalance || 0);
      const combinedBalance = primaryBal.plus(duplicateBal);

      // C. Update primary customer opening balance
      await tx.customer.update({
        where: { id: primaryCustomerId },
        data: {
          openingBalance: moneyToString(combinedBalance),
        },
      });

      // D. Update Invoice records referencing duplicate customer
      await tx.invoice.updateMany({
        where: { customerId: duplicateCustomerId },
        data: { customerId: primaryCustomerId },
      });

      // E. Update PaymentLog records referencing duplicate customer
      await tx.paymentLog.updateMany({
        where: { customerId: duplicateCustomerId },
        data: { customerId: primaryCustomerId },
      });

      // F. Update ReturnLog records referencing duplicate customer
      await tx.returnLog.updateMany({
        where: { customerId: duplicateCustomerId },
        data: { customerId: primaryCustomerId },
      });

      // G. Delete the duplicate customer record
      await tx.customer.delete({
        where: { id: duplicateCustomerId },
      });

      return {
        primaryName: primaryCustomer.name,
        duplicateName: duplicateCustomer.name,
        combinedBalance: combinedBalance.toNumber(),
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully merged "${result.duplicateName}" into "${result.primaryName}".`,
      data: result,
    });
  } catch (error) {
    console.error("Customer Merge Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to merge customer profiles" },
      { status: 500 }
    );
  }
}

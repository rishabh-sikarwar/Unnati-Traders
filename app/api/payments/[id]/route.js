import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { moneyToString } from "@/lib/money";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const { amount, reason } = await req.json();

    if (amount === undefined || amount === null || amount === "" || isNaN(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json({ error: "Invalid amount. Must be 0 or greater." }, { status: 400 });
    }

    // 1. Authorization Check
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER")) {
      return NextResponse.json({ error: "Forbidden. Admin or Shopkeeper access required." }, { status: 403 });
    }

    // 2. Retrieve existing payment log
    const paymentLog = await prisma.paymentLog.findUnique({
      where: { id },
    });

    if (!paymentLog) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    // 3. Prevent modifying Return Credits
    if (paymentLog.paymentMode === "RETURN_CREDIT") {
      return NextResponse.json(
        { error: "Return credits cannot be modified directly. Please reverse them in Sales Return History." },
        { status: 400 }
      );
    }

    // Determine if it is auto-migrated (linked to an invoice or contains "Auto-migrated" in remarks)
    const isAutoMigrated = !!(paymentLog.invoiceId || (paymentLog.remarks && paymentLog.remarks.includes("Auto-migrated")));
    if (isAutoMigrated && dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only Admins can edit auto-migrated invoice payments." }, { status: 403 });
    }

    const oldAmount = Number(paymentLog.amount);
    const newAmount = Number(amount);

    let newRemarks = paymentLog.remarks || "";

    // 4. Audit Trail: Generate and append note if amount changed
    if (oldAmount !== newAmount) {
      const date = new Date();
      const day = String(date.getDate()).padStart(2, "0");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      const auditNote = `[Edited on ${formattedDate}: Orig. ₹${oldAmount}]${reason ? ` ${reason.trim()}` : ""}`;
      const originalRemarks = paymentLog.remarks ? paymentLog.remarks.trim() : "";
      
      newRemarks = originalRemarks ? `${originalRemarks} | ${auditNote}` : auditNote;
    } else if (reason) {
      // If amount didn't change but a reason/remark was added, append it
      const originalRemarks = paymentLog.remarks ? paymentLog.remarks.trim() : "";
      newRemarks = originalRemarks ? `${originalRemarks} | ${reason.trim()}` : reason.trim();
    }

    // 5. Perform the database update
    const updatedPayment = await prisma.paymentLog.update({
      where: { id },
      data: {
        amount: moneyToString(newAmount),
        remarks: newRemarks || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully and audited.",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Edit Payment Route Error:", error);
    return NextResponse.json(
      { error: "Failed to update payment record." },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customerId = (await params).id;
    const body = await req.json();
    const { name, phone, email, type, address, gstNumber } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        type,
        address: address || null,
        gstNumber: gstNumber || null,
      },
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error) {
    console.error("[API ERROR] PATCH customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customerId = (await params).id;

    // Check for billing history: invoices, payments, returns
    const [invoiceCount, paymentCount, returnCount] = await Promise.all([
      prisma.invoice.count({ where: { customerId } }),
      prisma.paymentLog.count({ where: { customerId } }),
      prisma.returnLog.count({ where: { customerId } }),
    ]);

    if (invoiceCount > 0 || paymentCount > 0 || returnCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a customer with billing history. Please merge them instead." },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("[API ERROR] DELETE customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}

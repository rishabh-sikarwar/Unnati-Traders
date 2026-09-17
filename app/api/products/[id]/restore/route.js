import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can restore tyres." },
        { status: 403 }
      );
    }

    const { id } = params;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isArchived: false },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Restore product error:", error);
    return NextResponse.json(
      { error: "Failed to restore tyre." },
      { status: 500 }
    );
  }
}

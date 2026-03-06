import { currentUser } from "@clerk/nextjs/server"; // clerkClient removed!
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    // 1. Get the authenticated user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // 2. Check if the user already exists in your Prisma database
    let dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    // 3. If they don't exist, create them locally
    if (!dbUser) {
      // Check how many users exist. If 0, make them ADMIN
      const userCount = await prisma.user.count();

      // Use the exact uppercase strings that match your Prisma Enum
      const assignedRole = userCount === 0 ? "ADMIN" : "VISITOR";

      const fullName =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        "Unknown User";

      // Save to your PostgreSQL database
      dbUser = await prisma.user.create({
        data: {
          id: clerkUser.id,
          role: assignedRole,
          fullName: fullName,
        },
      });

      // Redirect to dashboard with a 'new' flag for the toast
      return NextResponse.redirect(new URL("/dashboard?auth=new", req.url));
    }

    // If they already exist, just redirect with 'success'
    return NextResponse.redirect(new URL("/dashboard?auth=success", req.url));
  } catch (error) {
    console.error("Failed to sync user:", error);
    return NextResponse.redirect(new URL("/dashboard?auth=error", req.url));
  }
}

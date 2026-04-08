import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    // 1. Get the authenticated user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Safely extract the primary email from Clerk
    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress || null;

    // 2. Check if the user already exists in your Prisma database
    let dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    // 3. If they don't exist, create them locally
    if (!dbUser) {
      const userCount = await prisma.user.count();
      const assignedRole = userCount === 0 ? "ADMIN" : "VISITOR";

      const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Unknown User";

      // Save to your PostgreSQL database
      dbUser = await prisma.user.create({
        data: {
          id: clerkUser.id,
          email: primaryEmail, // <--- SAVE THE EMAIL HERE
          role: assignedRole,
          fullName: fullName,
        },
      });

      return NextResponse.redirect(new URL("/dashboard?auth=new", req.url));
    }

    // 4. (Optional) Auto-heal existing users: 
    // If they exist in DB but don't have an email saved yet, update them!
    if (!dbUser.email && primaryEmail) {
      await prisma.user.update({
        where: { id: clerkUser.id },
        data: { email: primaryEmail }
      });
    }

    return NextResponse.redirect(new URL("/dashboard?auth=success", req.url));
  } catch (error) {
    console.error("Failed to sync user:", error);
    return NextResponse.redirect(new URL("/dashboard?auth=error", req.url));
  }
}
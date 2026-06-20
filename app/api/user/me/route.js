import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Identify the user via Clerk session
    const clerkUser = await currentUser();

    console.log("[DEBUG /api/user/me] Clerk User:", clerkUser ? {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
    } : null);

    if (!clerkUser) {
      console.log("[DEBUG /api/user/me] No clerkUser found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch their true role from your database
    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
      select: {
        role: true,
        fullName: true,
        locationId: true,
      }, // We only select what we need to keep the API fast
    });

    console.log("[DEBUG /api/user/me] Database User Query Result:", dbUser);

    if (!dbUser) {
      console.log("[DEBUG /api/user/me] dbUser is null, returning 404");
      return NextResponse.json(
        { error: "User not synced in database yet" },
        { status: 404 },
      );
    }

    // 3. Return the data
    return NextResponse.json(dbUser, { status: 200 });
  } catch (error) {
    console.error("[DEBUG /api/user/me] Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

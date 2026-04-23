import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Identify the user via Clerk session
    const clerkUser = await currentUser();

    if (!clerkUser) {
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

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not synced in database yet" },
        { status: 404 },
      );
    }

    // 3. Return the data
    return NextResponse.json(dbUser, { status: 200 });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

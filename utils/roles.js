import { auth } from "@clerk/nextjs/server";

export async function checkRole(expectedRole) {
  const { sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role;

  return userRole === expectedRole;
}

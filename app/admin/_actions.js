"use server";

import { checkRole } from "@/utils/roles";
import { clerkClient } from "@clerk/nextjs/server";

export async function setRole(formData) {
  const client = await clerkClient();

  // Check that the user trying to set the role is an admin
  if (!checkRole("admin")) {
    return { message: "Not Authorized" };
  }

  try {
    const res = await client.users.updateUserMetadata(formData.get("id"), {
      publicMetadata: { role: formData.get("role") },
    });
    return { message: res.publicMetadata };
  } catch (err) {
    return { message: err.message || "Failed to update role" };
  }
}

export async function removeRole(formData) {
  const client = await clerkClient();

  try {
    const res = await client.users.updateUserMetadata(formData.get("id"), {
      publicMetadata: { role: null },
    });
    return { message: res.publicMetadata };
  } catch (err) {
    return { message: err.message || "Failed to remove role" };
  }
}

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MergeForm from "./merge-form";
import { ArrowLeft, GitMerge } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomerMergePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch all active customers to be merged
  const customers = await prisma.customer.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
  });

  // Serialize to prevent Prisma Decimal serialization issues
  const serializedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone || "No Phone",
    type: c.type,
    openingBalance: Number(c.openingBalance),
    gstNumber: c.gstNumber || "",
    address: c.address || "",
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-12 pt-28 md:pt-32">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center border-b border-gray-200 pb-6">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-purple-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <GitMerge className="text-[#522874] h-8 w-8" />
              Merge Customer Accounts
            </h1>
            <p className="text-gray-500 mt-1 font-medium font-sans">
              Combine duplicate profiles into a single primary profile securely.
            </p>
          </div>
        </div>

        <MergeForm customers={serializedCustomers} />
      </div>
    </div>
  );
}

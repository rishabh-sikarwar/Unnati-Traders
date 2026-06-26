import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MergeForm from "./merge-form";
import CustomerDirectory from "./customer-directory";
import { ArrowLeft, GitMerge } from "lucide-react";
import Link from "next/link";
import { toDecimal } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CustomerMergePage({ searchParams }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/");
  }

  // Parse search parameters safely
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const query = resolvedSearchParams.query || "";
  const type = resolvedSearchParams.type || "ALL";

  const take = 20;
  const skip = (page - 1) * take;

  // Build prisma where filter for the table list
  const tableWhere = {
    isArchived: false,
  };

  if (query) {
    tableWhere.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
    ];
  }

  if (type !== "ALL") {
    tableWhere.type = type;
  }

  // Fetch data in a single database transaction
  const [tableCustomers, totalCount, allActiveCustomers] = await prisma.$transaction([
    prisma.customer.findMany({
      where: tableWhere,
      skip,
      take,
      orderBy: { name: "asc" },
    }),
    prisma.customer.count({ where: tableWhere }),
    prisma.customer.findMany({
      where: { isArchived: false },
      include: {
        invoices: { select: { grandTotal: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize all active customers for the MergeForm dropdowns (all active profiles)
  const serializedAllCustomers = allActiveCustomers.map((c) => {
    const totalBilled = c.invoices.reduce((sum, inv) => sum.plus(toDecimal(inv.grandTotal)), toDecimal(0));
    const totalPaid = c.payments.reduce((sum, pay) => sum.plus(toDecimal(pay.amount)), toDecimal(0));
    const currentBalance = totalBilled.plus(toDecimal(c.openingBalance || 0)).minus(totalPaid);

    return {
      id: c.id,
      name: c.name,
      phone: c.phone || "No Phone",
      type: c.type,
      openingBalance: Number(c.openingBalance),
      currentBalance: Number(currentBalance),
      gstNumber: c.gstNumber || "",
      address: c.address || "",
    };
  });

  // Serialize table customers (paginated & filtered list)
  const serializedTableCustomers = tableCustomers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone || "—",
    email: c.email || "—",
    type: c.type,
    openingBalance: Number(c.openingBalance),
    gstNumber: c.gstNumber || "—",
    address: c.address || "—",
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-12 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center border-b border-gray-200 pb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-purple-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Admin Command Center
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

        <MergeForm customers={serializedAllCustomers} />

        <hr className="my-8 border-gray-200" />

        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold text-gray-900">
            Master Customer Directory
          </h2>
          <CustomerDirectory
            customers={serializedTableCustomers}
            page={page}
            query={query}
            type={type}
            totalCount={totalCount}
            take={take}
          />
        </div>
      </div>
    </div>
  );
}

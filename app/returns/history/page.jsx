import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ReturnHistoryList from "@/components/returns/return-history-list";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReturnHistoryPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER")) {
    redirect("/dashboard");
  }

  if (dbUser.role === "SHOPKEEPER" && !dbUser.locationId) {
    redirect("/dashboard");
  }

  const showShopFilter = dbUser.role === "ADMIN";

  const locations = showShopFilter
    ? await prisma.location.findMany({
        orderBy: { name: "asc" },
      })
    : [];

  // Query all return records
  const returns = await prisma.returnLog.findMany({
    where:
      dbUser.role === "SHOPKEEPER"
        ? {
            locationId: dbUser.locationId,
          }
        : {},
    include: {
      customer: true,
      product: true,
      location: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Map Decimals to numbers to prevent Next.js page serialization warnings
  const serializedReturns = returns.map((ret) => ({
    ...ret,
    refundAmount: Number(ret.refundAmount),
    customer: {
      ...ret.customer,
      openingBalance: Number(ret.customer.openingBalance),
    },
    product: {
      ...ret.product,
      basePrice: Number(ret.product.basePrice),
    },
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-36 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-6 animate-in fade-in duration-500">
        
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-[#522874] rounded-lg">
              <History className="w-6 h-6" />
            </div>
            Sales Return Logs & History
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Manage returned products, verify credit note values, track restocked items, and review shopkeeper logs.
          </p>
        </div>

        {/* Interactive List and Filters */}
        <ReturnHistoryList
          returns={serializedReturns}
          locations={locations}
          userRole={dbUser.role}
          showShopFilter={showShopFilter}
        />
      </div>
    </div>
  );
}

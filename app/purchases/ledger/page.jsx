import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import PurchaseList from "./purchase-list";

export const dynamic = "force-dynamic";

export default async function PurchaseLedgerPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  })

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER")) {
    redirect("/dashboard");
  }

  // Fetch all purchases with their related items, locations, and the user who logged them
  const purchases = await prisma.purchase.findMany({
    where: {
      items: { some: {} },
    },
    include: {
      location: true,
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" }, // Newest first
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-6 animate-in fade-in duration-500">
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-[#522874] rounded-lg">
              <Truck className="w-6 h-6" />
            </div>
            Inward Purchase Ledger
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            View all stock inward records, supplier invoices, and detailed tyre
            counts.
          </p>
        </div>

        <PurchaseList purchases={purchases} locations={locations} userRole={dbUser.role}/>
      </div>
    </div>
  );
}

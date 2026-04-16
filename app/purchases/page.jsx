import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PurchaseForm from "@/components/purchases/purchase-form";
import { PackagePlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER"))
    redirect("/");

  // Fetch the master catalogue so Smart Search works
  const products = await prisma.product.findMany({
    select: { id: true, modelName: true, size: true, sku: true, basePrice: true },
    orderBy: { modelName: "asc" },
  });

  // Fetch active shops to determine where stock unloads
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <PackagePlus className="text-[#522874] h-8 w-8" />
            Purchase Invoice (Stock Inward)
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Log Apollo distributor invoices to track expenses and auto-update
            warehouse stock.
          </p>
        </div>

        <PurchaseForm
          products={products}
          locations={locations}
          userId={dbUser.id}
        />
      </div>
    </div>
  );
}

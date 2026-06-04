import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DownloadCloud } from "lucide-react";
import StockExportClient from "@/components/admin/stock-export-client";

export const dynamic = "force-dynamic";

export default async function InventoryExportPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") redirect("/");

  const products = await prisma.product.findMany({
    include: { inventories: true },
    orderBy: { modelName: "asc" },
  });

  const serializedProducts = products.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
  }));

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DownloadCloud className="text-[#522874] h-8 w-8" />
            Stock Excel Export
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Pick one or more shops, narrow the stock set, and download an Excel
            report for the filtered inventory.
          </p>
        </div>

        <StockExportClient products={serializedProducts} locations={locations} />
      </div>
    </div>
  );
}
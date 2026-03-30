import { prisma } from "@/lib/prisma";
import TransferStockForm from "@/components/admin/transfer-stock-form";

export const dynamic = "force-dynamic";

export default async function TransferPage() {
  const products = await prisma.product.findMany({
    orderBy: { modelName: "asc" },
  });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Transfer Stock Between Shops
        </h1>

        <TransferStockForm products={products} locations={locations} />
      </div>
    </div>
  );
}

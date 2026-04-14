import { prisma } from "@/lib/prisma";
import TyreCatalogue from "@/components/public/tyre-catalogue";
import { Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TyresPage() {
  const products = await prisma.product.findMany({
    orderBy: { modelName: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-16 pt-28 md:pt-32">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-[#522874] mb-4 shadow-inner">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Our Master Catalogue
          </h1>
          <p className="text-gray-500 text-lg">
            Browse our complete range of authentic Apollo tyres. From heavy-duty
            trucks to premium passenger cars.
          </p>
        </div>

        <TyreCatalogue products={products} />
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ReturnForm from "@/components/returns/return-form";
import { Undo2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id }
  });

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER")) {
    redirect("/dashboard");
  }

  // Fetch necessary data for the form dropdowns
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  const products = await prisma.product.findMany({ orderBy: { modelName: "asc" } });
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Undo2 className="text-[#522874] h-8 w-8" />
            Sales Returns & Credit Notes
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Process returned items, manage Apollo claims, and automatically adjust customer Khata balances.
          </p>
        </div>

        <ReturnForm customers={customers} products={products} locations={locations} userId={dbUser.id} />

      </div>
    </div>
  );
}
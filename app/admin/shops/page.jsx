import { prisma } from "@/lib/prisma";
import AddShopForm from "@/components/admin/add-shop-form";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation"; // FIXED INCORRECT IMPORT
import ShopsTable from "@/components/admin/shops-table"; // IMPORT THE NEW TABLE

export const dynamic = "force-dynamic";

export default async function ShopsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/");
  }

  const shops = await prisma.location.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 pt-20 md:pt-36 lg:pt-24 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Locations</h1>
          <p className="text-gray-500 mt-1">
            Add new shops, warehouses, or update their addresses.
          </p>
        </div>

        <AddShopForm />

        {/* Use the new interactive table component! */}
        <ShopsTable shops={shops} />
      </div>
    </div>
  );
}

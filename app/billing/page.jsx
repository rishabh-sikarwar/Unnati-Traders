import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import BillingForm from "@/components/billing/billing-form";
import { AlertTriangle, ReceiptIndianRupee } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const clerkUser = await currentUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
    include: { location: true },
  });

  if (!dbUser?.locationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">
            You must be assigned to a specific Shop or Warehouse to generate
            bills.
          </p>
        </div>
      </div>
    );
  }

  // Fetch ONLY products that have stock > 0 in THIS user's location
  const localInventory = await prisma.inventory.findMany({
    where: {
      locationId: dbUser.locationId,
      quantity: { gt: 0 }, // Don't show out-of-stock items in the billing dropdown
    },
    include: { product: true },
    orderBy: { product: { modelName: "asc" } },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 pt-28 md:pt-32">
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ReceiptIndianRupee className="text-[#522874] h-8 w-8" />
            New Tax Invoice
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Billing from:{" "}
            <span className="text-[#522874]">{dbUser.location.name}</span>
          </p>
        </div>

        {/* Pass the data to the interactive client form */}
        <BillingForm
          inventory={localInventory}
          locationId={dbUser.locationId}
          userId={dbUser.id}
        />
      </div>
    </div>
  );
}

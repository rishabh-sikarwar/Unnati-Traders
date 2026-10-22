import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, ShoppingBag, Truck } from "lucide-react";
import DealerRequestsManager from "@/components/orders/dealer-requests-manager";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dealer Order Requests | Unnati Traders",
  description: "Fulfill incoming wholesale tyre orders and generate tax invoices.",
};

export default async function DealerRequestsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
    include: { location: true },
  });

  if (!dbUser) redirect("/");

  // Guard: Only ADMIN or SHOPKEEPER can access
  if (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER") {
    redirect("/dashboard");
  }

  // Shopkeeper must have an assigned location
  if (dbUser.role === "SHOPKEEPER" && !dbUser.locationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">No Shop Assigned</h2>
          <p className="text-gray-500 mt-2">
            Please ask the Admin to assign your account to a retail branch to fulfill incoming dealer orders.
          </p>
        </div>
      </div>
    );
  }

  let whereClause = {};
  if (dbUser.role === "SHOPKEEPER") {
    whereClause.locationId = dbUser.locationId;
  }

  const rawOrders = await prisma.dealerOrder.findMany({
    where: whereClause,
    include: {
      location: true,
      customer: true,
      user: true,
      items: {
        include: {
          product: {
            include: {
              inventories: true,
            },
          },
        },
      },
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Serialize orders for client
  const serializedOrders = rawOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    notes: o.notes,
    paymentReference: o.paymentReference || null,
    paymentSubmittedAt: o.paymentSubmittedAt ? o.paymentSubmittedAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    locationId: o.locationId,
    location: o.location
      ? {
          id: o.location.id,
          name: o.location.name,
          code: o.location.code,
        }
      : null,
    customer: o.customer
      ? {
          id: o.customer.id,
          name: o.customer.name,
          phone: o.customer.phone,
          email: o.customer.email,
        }
      : null,
    user: o.user
      ? {
          id: o.user.id,
          fullName: o.user.fullName,
          mobile: o.user.mobile,
          email: o.user.email,
        }
      : null,
    invoiceId: o.invoiceId,
    invoice: o.invoice
      ? {
          id: o.invoice.id,
          invoiceNumber: o.invoice.invoiceNumber,
          grandTotal: Number(o.invoice.grandTotal),
        }
      : null,
    items: o.items.map((it) => {
      const shopInv = it.product?.inventories?.find(
        (inv) => inv.locationId === o.locationId
      );
      return {
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        actualShopStock: shopInv ? shopInv.quantity : 0,
        product: it.product
          ? {
              id: it.product.id,
              modelName: it.product.modelName,
              brand: it.product.brand,
              size: it.product.size,
              basePrice: Number(it.product.basePrice || 0),
            }
          : null,
      };
    }),
  }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-12 pt-28 md:pt-32">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/orders"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#522874]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sales Register
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
              <Truck className="w-7 h-7 text-[#522874]" />
              Dealer Order Requests
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {dbUser.role === "ADMIN"
                ? "Manage network-wide wholesale order bookings."
                : `Fulfill incoming dealer tyre requests for ${dbUser.location?.name}.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/orders">
              <Button variant="outline" size="sm" className="border-gray-200">
                View Invoices & Sales
              </Button>
            </Link>
          </div>
        </div>

        {/* Manager Component */}
        <DealerRequestsManager
          initialOrders={serializedOrders}
          userRole={dbUser.role}
          shopName={dbUser.location?.name || ""}
        />
      </div>
    </div>
  );
}

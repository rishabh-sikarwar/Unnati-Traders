import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReturnForm from "@/components/returns/return-form";
import { Undo2, History, ArrowRight, ShieldCheck, AlertTriangle, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SHOPKEEPER")) {
    redirect("/dashboard");
  }

  // Fetch necessary data for the form dropdowns
  const [customers, products, locations, recentReturns] = await Promise.all([
    prisma.customer.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isArchived: false }, orderBy: { modelName: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.returnLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        product: { select: { brand: true, modelName: true, size: true } },
        location: { select: { name: true } },
      },
    }),
  ]);

  const serializedCustomers = customers.map((c) => ({
    ...c,
    openingBalance: Number(c.openingBalance),
  }));

  const serializedProducts = products.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
  }));

  const serializedRecentReturns = recentReturns.map((r) => ({
    ...r,
    refundAmount: Number(r.refundAmount),
  }));

  // Quick statistics
  const goodReturnsCount = await prisma.returnLog.count({ where: { condition: "GOOD" } });
  const defectiveReturnsCount = await prisma.returnLog.count({ where: { condition: "DEFECTIVE" } });

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-12 pt-28 md:pt-36 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-8 animate-in fade-in duration-500">
        
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-[#522874] rounded-lg">
                <Undo2 className="h-7 w-7" />
              </div>
              Sales Returns & Credit Notes
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Process returned items, manage claims, restock products, and automatically issue credit notes.
            </p>
          </div>

          <Link
            href="/returns/history"
            className="flex items-center justify-center gap-2 bg-[#522874] hover:bg-[#3d1d56] text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
          >
            <History className="w-4 h-4" /> View Return Logs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form (8/12 grid) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-[#1a0a2e] text-white px-6 py-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Undo2 className="w-5 h-5 text-purple-300" /> Return Processing Engine
                </h2>
              </div>
              <div className="p-6 md:p-8">
                <ReturnForm
                  customers={serializedCustomers}
                  products={serializedProducts}
                  locations={locations}
                  userId={dbUser.id}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Recent Return List & Stats (4/12 grid) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Summary Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg w-fit mx-auto mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block mb-1">Restocked (Good)</span>
                <span className="text-2xl font-black text-green-700">{goodReturnsCount}</span>
              </div>

              <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg w-fit mx-auto mb-2">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block mb-1">Claimed (Defective)</span>
                <span className="text-2xl font-black text-red-700">{defectiveReturnsCount}</span>
              </div>
            </div>

            {/* Recent Log List */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
              <h3 className="font-black text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-[#522874]" /> Recent Returns
              </h3>

              {serializedRecentReturns.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-medium">
                  No returns recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {serializedRecentReturns.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-purple-50/10 transition-colors flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 text-sm leading-tight">{item.customer.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {format(new Date(item.createdAt), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            item.condition === "GOOD"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.condition}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-800">{item.product.modelName}</span>
                        <span className="text-gray-400"> • Size: {item.product.size}</span>
                        <span className="text-gray-400"> • Qty: {item.quantity}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-gray-400">Credit Note Value:</span>
                        <span className="font-extrabold text-green-600 flex items-center">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {formatNumber(item.refundAmount, 2)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <Link
                    href="/returns/history"
                    className="block text-center text-xs font-bold text-[#522874] hover:text-[#3d1d56] bg-purple-50 hover:bg-purple-100 py-3 rounded-xl transition-colors mt-2"
                  >
                    View All Return History
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
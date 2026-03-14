import { prisma } from "@/lib/prisma";
import AddShopForm from "@/components/admin/add-shop-form";
import { currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { redirect } from "next/dist/server/api-utils";
import DeleteShopButton from "@/components/admin/delete-shop-button";

export default async function ShopsPage() {

    const clerkUser = await currentUser()
    const dbUser = await prisma.user.findUnique({
        where:{id: clerkUser.id},
    })

    if (!dbUser || dbUser.role !== "ADMIN") {
        redirect("/") 
    }

  const shops = await prisma.location.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 pt-24 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Manage Shops</h1>

        <AddShopForm />

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Address</th>
                <th className="p-4 text-left">Delete</th>
              </tr>
            </thead>

            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id} className="border-b">
                  <td className="p-4">{shop.name}</td>
                  <td className="p-4">{shop.type}</td>
                  <td className="p-4">{shop.address}</td>
                  <td className="p-4">
                    <DeleteShopButton id={shop.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

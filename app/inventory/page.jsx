import { prisma } from "@/lib/prisma"
import UpdateStock from "@/components/inventory/update-stock"

export default async function InventoryPage(){

  const inventory = await prisma.inventory.findMany({
    include:{
      product:true,
      location:true
    }
  })

  return(

    <div className="p-8 pt-24 bg-gray-50 min-h-screen">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Inventory
        </h1>

        <table className="w-full bg-white rounded-lg shadow">

          <thead className="border-b">

            <tr>
              <th className="p-4 text-left">Product</th>
              <th className="p-4 text-left">Location</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-left">Update</th>
            </tr>

          </thead>

          <tbody>

            {inventory.map(item => (

              <tr key={item.id} className="border-b">

                <td className="p-4">
                  {item.product.modelName}
                </td>

                <td className="p-4">
                  {item.location.name}
                </td>

                <td className="p-4 font-bold">
                  {item.quantity}
                </td>

                <td className="p-4">

                  <UpdateStock
                    productId={item.productId}
                    locationId={item.locationId}
                  />

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}
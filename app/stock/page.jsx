// import React from "react";
// import { prisma } from "@/lib/prisma";
// import { addTyreProduct } from "@/app/actions/stock";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { PackageSearch, PlusCircle } from "lucide-react";

// export default async function StockPage() {
//   // Fetch all existing tyres from the database directly on the server
//   const products = await prisma.product.findMany({
//     orderBy: { createdAt: "desc" },
//   });

//   return (
//     <div className="min-h-screen bg-gray-50 p-6 pt-24">
//       <div className="max-w-7xl mx-auto space-y-6">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">
//               Stock Management
//             </h1>
//             <p className="text-gray-600">
//               Manage Apollo tyre catalogue and pricing.
//             </p>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Side: Add New Tyre Form */}
//           <Card className="lg:col-span-1 h-fit">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <PlusCircle className="w-5 h-5 text-[#522874]" />
//                 Add New Tyre
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               {/* Note: In Next.js 15, we can pass Server Actions directly to the action attribute */}
//               <form action={addTyreProduct} className="space-y-4">
//                 <div>
//                   <label className="text-sm font-medium">SKU / Item Code</label>
//                   <input
//                     required
//                     name="sku"
//                     type="text"
//                     placeholder="e.g. APL-AMZ-165"
//                     className="w-full p-2 border rounded-md mt-1"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">Model Name</label>
//                   <input
//                     required
//                     name="modelName"
//                     type="text"
//                     placeholder="e.g. Amazer 4G Life"
//                     className="w-full p-2 border rounded-md mt-1"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">Tyre Size</label>
//                   <input
//                     required
//                     name="size"
//                     type="text"
//                     placeholder="e.g. 165/80 R14"
//                     className="w-full p-2 border rounded-md mt-1"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium">
//                     Base Price (₹) - Excl. GST
//                   </label>
//                   <input
//                     required
//                     name="basePrice"
//                     type="number"
//                     step="0.01"
//                     placeholder="3200"
//                     className="w-full p-2 border rounded-md mt-1"
//                   />
//                 </div>
//                 <Button
//                   type="submit"
//                   className="w-full bg-[#522874] hover:bg-[#3d1d56]"
//                 >
//                   Save Product
//                 </Button>
//               </form>
//             </CardContent>
//           </Card>

//           {/* Right Side: Catalogue Table */}
//           <Card className="lg:col-span-2">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <PackageSearch className="w-5 h-5 text-[#522874]" />
//                 Current Product Catalogue
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-left border-collapse">
//                   <thead>
//                     <tr className="border-b">
//                       <th className="p-3 text-sm font-semibold text-gray-600">
//                         SKU
//                       </th>
//                       <th className="p-3 text-sm font-semibold text-gray-600">
//                         Model & Size
//                       </th>
//                       <th className="p-3 text-sm font-semibold text-gray-600">
//                         Base Price
//                       </th>
//                       <th className="p-3 text-sm font-semibold text-gray-600">
//                         Final Price (28% GST)
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {products.length === 0 ? (
//                       <tr>
//                         <td
//                           colSpan="4"
//                           className="text-center p-8 text-gray-500"
//                         >
//                           No tyres added yet. Use the form to add your first
//                           product.
//                         </td>
//                       </tr>
//                     ) : (
//                       products.map((product) => {
//                         const finalPrice =
//                           product.basePrice +
//                           product.basePrice * (product.gstRate / 100);
//                         return (
//                           <tr
//                             key={product.id}
//                             className="border-b hover:bg-gray-50"
//                           >
//                             <td className="p-3 font-mono text-sm">
//                               {product.sku}
//                             </td>
//                             <td className="p-3">
//                               <div className="font-medium text-gray-900">
//                                 {product.modelName}
//                               </div>
//                               <div className="text-sm text-gray-500">
//                                 {product.size} • Apollo
//                               </div>
//                             </td>
//                             <td className="p-3">
//                               ₹{product.basePrice.toLocaleString()}
//                             </td>
//                             <td className="p-3 font-bold text-green-700">
//                               ₹{finalPrice.toLocaleString()}
//                             </td>
//                           </tr>
//                         );
//                       })
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";

export default function StockPage() {
  const [inventory, setInventory] = useState([]);

  async function loadInventory() {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setInventory(data);
  }

  useEffect(() => {
    loadInventory();
  }, []);

  async function updateStock(id, quantity) {
    await fetch("/api/inventory/update", {
      method: "POST",
      body: JSON.stringify({
        productId,
        locationId,
        quantity: qty,
        type,
      }),
    });

    loadInventory();
  }

  async function updateProduct(product) {
    await fetch("/api/products/update", {
      method: "POST",
      body: JSON.stringify(product),
    });

    loadInventory();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Stock Management</h1>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="p-4 text-left">Tyre</th>
                <th className="p-4 text-left">Size</th>
                <th className="p-4 text-left">Shop</th>
                <th className="p-4 text-left">Stock</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">Update</th>
              </tr>
            </thead>

            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-4">{item.product.modelName}</td>

                  <td className="p-4">{item.product.size}</td>

                  <td className="p-4">{item.location.name}</td>

                  <td className="p-4 flex gap-2 items-center">
                    <button
                      onClick={() =>
                        updateStock(
                          item.productId,
                          item.locationId,
                          1,
                          "remove",
                        )
                      }
                      className="bg-red-500 text-white px-2 rounded"
                    >
                      -
                    </button>

                    <span className="font-semibold">{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateStock(item.productId, item.locationId, 1, "add")
                      }
                      className="bg-green-600 text-white px-2 rounded"
                    >
                      +
                    </button>
                  </td>

                  <td className="p-4">₹{item.product.basePrice}</td>

                  <td className="p-4">
                    <button
                      onClick={() => updateProduct(item.product)}
                      className="bg-purple-700 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
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
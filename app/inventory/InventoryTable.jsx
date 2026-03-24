"use client";

import { useState } from "react";
import { Filter } from "lucide-react";

export default function InventoryTable({ products, locations }) {
  const [selectedShop, setSelectedShop] = useState("ALL");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Filter Toolbar */}
      <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-end gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-bold text-gray-600">Filter by Shop:</span>
        <select
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#522874] bg-white cursor-pointer min-w-[200px]"
        >
          <option value="ALL">All Shops (Grand Total)</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-white border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">
                Tyre Model
              </th>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">
                {selectedShop === "ALL" ? "Total Network Stock" : "Shop Stock"}
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              // Calculate the stock based on the filter
              let displayStock = 0;
              if (selectedShop === "ALL") {
                // Sum up all inventories for this product
                displayStock = product.inventories.reduce(
                  (acc, inv) => acc + inv.quantity,
                  0,
                );
              } else {
                // Find the specific shop's inventory
                const shopInv = product.inventories.find(
                  (inv) => inv.locationId === selectedShop,
                );
                displayStock = shopInv ? shopInv.quantity : 0;
              }

              return (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-purple-50/20 transition-colors"
                >
                  <td className="p-4 font-mono text-xs text-gray-500">
                    {product.sku}
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {product.modelName}
                  </td>
                  <td className="p-4 font-semibold text-[#522874]">
                    {product.size}
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-md font-black text-sm ${
                        displayStock <= product.lowStock
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {displayStock}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

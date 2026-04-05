"use client";

import { useState, useMemo } from "react";
import { Search, Filter, PackageX } from "lucide-react";

export default function InventoryTable({ products, locations }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("ALL");

  // Flatten the nested inventory data into a clean, filterable list
  const flatInventory = useMemo(() => {
    let rows = [];
    products.forEach((p) => {
      p.inventories.forEach((inv) => {
        rows.push({
          id: inv.id,
          modelName: p.modelName,
          size: p.size,
          sku: p.sku,
          lowStockThreshold: p.lowStock,
          locationId: inv.locationId,
          locationName:
            locations.find((l) => l.id === inv.locationId)?.name || "Unknown",
          quantity: inv.quantity,
        });
      });
    });
    return rows;
  }, [products, locations]);

  // Apply Search & Filters
  const filteredData = flatInventory.filter((row) => {
    const matchesSearch =
      row.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      selectedLocation === "ALL" || row.locationId === selectedLocation;

    return matchesSearch && matchesLocation;
  });

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by SKU, Model, or Size..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white cursor-pointer font-medium text-gray-700"
          >
            <option value="ALL">All Shops & Warehouses</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MOBILE-RESPONSIVE TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Tyre Details
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Physical Stock
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            {filteredData.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan="4"
                  className="block md:table-cell p-10 text-center text-gray-500"
                >
                  <PackageX className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold">No inventory found.</p>
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="block md:table-row border-b border-gray-100 hover:bg-purple-50/10 transition-colors p-4 md:p-0"
                >
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-lg md:text-base">
                        {row.modelName}{" "}
                        <span className="text-[#522874] font-semibold">
                          ({row.size})
                        </span>
                      </span>
                      <code className="text-xs text-gray-400 font-mono mt-0.5">
                        SKU: {row.sku}
                      </code>
                    </div>
                  </td>

                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Location:
                      </span>
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded uppercase tracking-wide">
                        {row.locationName}
                      </span>
                    </div>
                  </td>

                  <td className="block md:table-cell md:p-4 md:text-right mb-3 md:mb-0">
                    <div className="flex justify-between md:justify-end items-center">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Qty:
                      </span>
                      <span className="font-black text-xl md:text-lg text-[#522874]">
                        {row.quantity}
                      </span>
                    </div>
                  </td>

                  <td className="block md:table-cell md:p-4 md:text-center border-t md:border-none pt-3 md:pt-0">
                    <div className="flex justify-between md:justify-center items-center">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Status:
                      </span>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                          row.quantity === 0
                            ? "bg-red-100 text-red-700"
                            : row.quantity <= row.lowStockThreshold
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {row.quantity === 0
                          ? "Out of Stock"
                          : row.quantity <= row.lowStockThreshold
                            ? "Low Stock"
                            : "In Stock"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

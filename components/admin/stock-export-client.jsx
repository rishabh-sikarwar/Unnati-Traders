"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { Download, Filter, Search, CheckSquare, Square } from "lucide-react";
import { formatNumber } from "@/lib/format";

export default function StockExportClient({ products, locations }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationIds, setSelectedLocationIds] = useState(() =>
    locations.map((location) => location.id),
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const flatInventory = useMemo(() => {
    const rows = [];

    products.forEach((product) => {
      product.inventories.forEach((inventory) => {
        if (inventory.quantity > 0) {
          rows.push({
            productId: product.id,
            modelName: product.modelName,
            size: product.size,
            sku: product.sku,
            category: product.category || "GENERAL",
            lowStockThreshold: product.lowStock || 0,
            locationId: inventory.locationId,
            locationName:
              locations.find((location) => location.id === inventory.locationId)
                ?.name || "Unknown",
            quantity: inventory.quantity,
          });
        }
      });
    });

    return rows;
  }, [products, locations]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return flatInventory.filter((row) => {
      const matchesSearch =
        !query ||
        row.modelName.toLowerCase().includes(query) ||
        row.size.toLowerCase().includes(query) ||
        row.sku.toLowerCase().includes(query) ||
        row.locationName.toLowerCase().includes(query);

      const matchesLocation = selectedLocationIds.includes(row.locationId);

      return matchesSearch && matchesLocation;
    });
  }, [flatInventory, searchQuery, selectedLocationIds]);

  const totals = useMemo(() => {
    const totalQuantity = filteredRows.reduce(
      (sum, row) => sum + Number(row.quantity || 0),
      0,
    );

    return {
      totalRows: filteredRows.length,
      totalQuantity,
    };
  }, [filteredRows]);

  const toggleLocation = (locationId) => {
    setSelectedLocationIds((current) =>
      current.includes(locationId)
        ? current.filter((id) => id !== locationId)
        : [...current, locationId],
    );
  };

  const selectAllLocations = () => {
    setSelectedLocationIds(locations.map((location) => location.id));
  };

  const clearLocations = () => {
    setSelectedLocationIds([]);
  };

  const downloadExcel = () => {
    if (filteredRows.length === 0) {
      return toast.error("No stock found for the selected filters.");
    }

    setIsDownloading(true);

    try {
      const stockSheetData = filteredRows.map((row) => ({
        "Shop / Location": row.locationName,
        "Tyre Model": row.modelName,
        Size: row.size,
        "Available Qty": row.quantity,
      }));

      const summarySheetData = [
        {
          Metric: "Selected Shops",
          Value:
            selectedLocationIds.length === locations.length
              ? "All Shops"
              : locations
                  .filter((location) => selectedLocationIds.includes(location.id))
                  .map((location) => location.name)
                  .join(", ") || "None",
        },
        { Metric: "Search Filter", Value: searchQuery || "All" },
        { Metric: "Matching Rows", Value: totals.totalRows },
        { Metric: "Total Quantity", Value: totals.totalQuantity },
      ];

      const summaryWorksheet = XLSX.utils.json_to_sheet(summarySheetData);
      const stockWorksheet = XLSX.utils.json_to_sheet(stockSheetData);
      const workbook = XLSX.utils.book_new();

      //XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");
      XLSX.utils.book_append_sheet(workbook, stockWorksheet, "Filtered Stock");

      const safeLabel =
        selectedLocationIds.length === locations.length
          ? "All_Shops"
          : locations
              .filter((location) => selectedLocationIds.includes(location.id))
              .map((location) => location.name)
              .join("_")
              .replace(/[^a-zA-Z0-9]+/g, "_") || "Selected_Shops";

      XLSX.writeFile(workbook, `Unnati_Stock_Report_${safeLabel}.xlsx`);
      toast.success("Stock Excel downloaded!");
    } catch (error) {
      toast.error(error.message || "Failed to download stock Excel.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, model, size, or shop..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all font-medium text-gray-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllLocations}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
            >
              <CheckSquare className="w-4 h-4" /> All Shops
            </button>
            <button
              type="button"
              onClick={clearLocations}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              <Square className="w-4 h-4" /> Clear
            </button>
            <button
              type="button"
              onClick={downloadExcel}
              disabled={isDownloading || filteredRows.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#522874] text-white font-bold hover:bg-[#3d1d56] transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Downloading..." : "Download Excel"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#522874] font-bold text-xs uppercase tracking-widest">
          <Filter className="w-4 h-4" /> Select Shops
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map((location) => {
            const checked = selectedLocationIds.includes(location.id);

            return (
              <label
                key={location.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${checked ? "border-[#522874] bg-purple-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLocation(location.id)}
                  className="h-4 w-4 accent-[#522874]"
                />
                <span className="font-semibold text-gray-800">{location.name}</span>
              </label>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Matching Rows
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {filteredRows.length}
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Total Quantity
            </div>
            <div className="text-2xl font-black text-[#522874] mt-1">
              {formatNumber(totals.totalQuantity, 0)}
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Selected Shops
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {selectedLocationIds.length}
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Export Status
            </div>
            <div className="text-2xl font-black text-green-600 mt-1">
              Ready
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Tyre Details
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Shop
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Qty
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            {filteredRows.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan="4"
                  className="block md:table-cell p-10 text-center text-gray-500"
                >
                  No stock matches the selected filters.
                </td>
              </tr>
            ) : (
              filteredRows.slice(0, 20).map((row) => (
                <tr
                  key={`${row.productId}-${row.locationId}`}
                  className="block md:table-row border-b border-gray-100 hover:bg-purple-50/10 transition-colors p-4 md:p-0"
                >
                  <td className="block md:table-cell md:p-4 mb-2 md:mb-0">
                    <div className="font-bold text-gray-900 text-lg md:text-base">
                      {row.modelName}{" "}
                      <span className="text-[#522874] font-semibold">
                        ({row.size})
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      SKU: {row.sku}
                    </div>
                  </td>

                  <td className="block md:table-cell md:p-4 mb-2 md:mb-0">
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Shop:
                      </span>
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded uppercase tracking-wide">
                        {row.locationName}
                      </span>
                    </div>
                  </td>

                  <td className="block md:table-cell md:p-4 md:text-right mb-2 md:mb-0">
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
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${row.quantity <= row.lowStockThreshold ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}
                      >
                        {row.quantity <= row.lowStockThreshold
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
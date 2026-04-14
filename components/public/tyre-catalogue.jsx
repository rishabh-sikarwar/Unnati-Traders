"use client";

import { useState } from "react";
import { Search, Disc, Tag, Layers } from "lucide-react";

export default function TyreCatalogue({ products }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Get unique categories for the filter
  const categories = ["ALL", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by model, size, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none transition-all bg-gray-50"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none font-bold text-gray-700 bg-gray-50 cursor-pointer md:w-64"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Tyre Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 font-medium bg-white rounded-3xl border border-dashed border-gray-300">
            No tyres match your search criteria.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col h-full"
            >
              {/* Card Header (Image Placeholder/Brand) */}
              <div className="h-32 bg-gradient-to-br from-purple-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                <Disc className="w-20 h-20 text-[#522874] opacity-10 group-hover:scale-110 group-hover:rotate-180 transition-all duration-700" />
                <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#522874] border border-purple-100">
                  {product.brand}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-auto">
                  <h3 className="text-xl font-black text-gray-900 leading-tight mb-1 group-hover:text-[#522874] transition-colors">
                    {product.modelName}
                  </h3>
                  <div className="text-sm font-bold text-[#522874] mb-4 bg-purple-50 inline-block px-2 py-1 rounded">
                    Size: {product.size}
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 text-sm font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" /> SKU: {product.sku}
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />{" "}
                    {product.category.replace(/_/g, " ")} • {product.tubeType}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

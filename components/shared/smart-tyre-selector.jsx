"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

export default function SmartTyreSelector({
  products,
  selectedProductId,
  onSelect,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync the search bar text if the parent resets the form (e.g., after a successful save)
  useEffect(() => {
    if (!selectedProductId) {
      setSearchQuery("");
    }
  }, [selectedProductId]);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.modelName.toLowerCase().includes(query) ||
      p.size.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query)
    );
  });

  // Handle Selection
  const handleSelectTyre = (product) => {
    onSelect(product.id); // Tell the parent component which ID was selected
    setSearchQuery(`${product.modelName} (${product.size})`);
    setIsDropdownOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by model, size, or SKU..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSelect(""); // Clear parent selection if they start typing again
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all cursor-text bg-white"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 shadow-xl rounded-lg max-h-64 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No tyres found matching "{searchQuery}"
            </div>
          ) : (
            <ul className="py-2">
              {filteredProducts.map((p) => (
                <li
                  key={p.id}
                  onClick={() => handleSelectTyre(p)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                    selectedProductId === p.id
                      ? "bg-purple-50 text-[#522874] font-bold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>
                      {p.modelName}{" "}
                      <span className="text-[#522874] font-semibold">
                        ({p.size})
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">SKU: {p.sku}</span>
                  </div>
                  {selectedProductId === p.id && <Check className="w-4 h-4" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

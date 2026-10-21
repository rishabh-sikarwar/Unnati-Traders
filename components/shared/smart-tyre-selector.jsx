"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Lock, X } from "lucide-react";

export default function SmartTyreSelector({
  products = [],
  selectedProductId,
  onSelect,
  locked = false,
  readOnly = false,
}) {
  const isLocked = Boolean(locked || readOnly);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Find currently selected product (from inventory or products array)
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Sync search input text whenever selectedProductId or products change from parent
  useEffect(() => {
    if (!selectedProductId) {
      setSearchQuery("");
    } else if (selectedProduct) {
      setSearchQuery(`${selectedProduct.modelName} (${selectedProduct.size})`);
    }
  }, [selectedProductId, selectedProduct]);

  // Close dropdown and revert search text if user clicks outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        // If an item was selected, restore its display name; otherwise clear search query
        if (selectedProduct) {
          setSearchQuery(`${selectedProduct.modelName} (${selectedProduct.size})`);
        } else {
          setSearchQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedProduct]);

  // STEP 1: If locked / read-only mode, render styled non-clickable element
  if (isLocked) {
    return (
      <div className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-between cursor-not-allowed select-none opacity-90 shadow-2xs">
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-extrabold text-sm text-gray-900 truncate">
              {selectedProduct?.modelName || "Selected Tyre"}
            </span>
            {selectedProduct?.size && (
              <span className="text-[#522874] font-bold text-xs truncate">
                ({selectedProduct.size})
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
            {selectedProduct?.brand && <span>{selectedProduct.brand}</span>}
            {selectedProduct?.brand && selectedProduct?.sku && <span>•</span>}
            {selectedProduct?.sku && <span>SKU: {selectedProduct.sku}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-[#522874] text-[10px] font-bold uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          <span>Locked</span>
        </div>
      </div>
    );
  }

  // Filter products when open
  const selectedLabel = selectedProduct
    ? `${selectedProduct.modelName} (${selectedProduct.size})`
    : "";

  const filteredProducts = products.filter((p) => {
    const rawQuery = searchQuery.trim().toLowerCase();
    // If search query is empty OR matches the selected item's label, show all products
    if (!rawQuery || rawQuery === selectedLabel.toLowerCase()) {
      return true;
    }

    const searchableText = `${p.modelName || ""} ${p.size || ""} ${p.brand || ""} ${p.sku || ""} ${p.hsnCode || ""}`.toLowerCase();
    const queryParts = rawQuery.split(/\s+/).filter(Boolean);
    return queryParts.every((part) => searchableText.includes(part));
  });

  const handleSelectTyre = (product) => {
    onSelect(product.id);
    setSearchQuery(`${product.modelName} (${product.size})`);
    setIsDropdownOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery("");
    onSelect("");
    setIsDropdownOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by model, size, SKU, or brand..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => {
            setIsDropdownOpen(true);
          }}
          className="w-full pl-9 pr-16 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none transition-all cursor-text bg-white"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 pointer-events-none ${
              isDropdownOpen ? "rotate-180 text-[#522874]" : ""
            }`}
          />
        </div>
      </div>

      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 shadow-xl rounded-xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-xs text-gray-500 text-center">
              No tyres found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <ul className="py-1 divide-y divide-gray-50">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductId === p.id;
                const searchableValue = `${p.modelName} ${p.size} ${p.sku}`;

                return (
                  <li
                    key={p.id}
                    data-search-value={searchableValue}
                    onClick={() => handleSelectTyre(p)}
                    className={`px-3.5 py-2 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-purple-50 text-[#522874] font-bold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">
                        <strong className="font-black text-gray-900">{p.modelName}</strong>{" "}
                        <span className="text-[#522874] font-bold">({p.size})</span>
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono truncate">
                        {p.brand ? `${p.brand} • ` : ""}SKU: {p.sku}
                        {p.hsnCode ? ` • HSN: ${p.hsnCode}` : ""}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#522874] shrink-0" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

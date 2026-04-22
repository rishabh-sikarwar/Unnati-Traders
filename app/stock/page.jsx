"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  PackageSearch,
  PlusCircle,
  Trash2,
  Loader2,
  ArrowRightLeft,
  AlertTriangle,
  Search,
  Filter,
  Edit,
  X,
  Save,
} from "lucide-react";

export default function StockPage() {
  const router = useRouter();
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTERS & SEARCH ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // --- NEW TYRE FORM ---
  const [newModel, setNewModel] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newCategory, setNewCategory] = useState("TWO_WHEELER");
  const [newPrice, setNewPrice] = useState("");
  const [newHsn, setNewHsn] = useState("4011");
  const [addingTyre, setAddingTyre] = useState(false);

  // --- MODALS ---
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    modelName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [editModal, setEditModal] = useState({ isOpen: false, product: null });
  const [isEditing, setIsEditing] = useState(false);

  async function loadCatalogue() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setCatalogue(data);
    } catch (error) {
      toast.error("Failed to load catalogue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalogue();
  }, []);

  // --- DERIVE CATEGORIES & FILTER DATA ---
  const categories = useMemo(() => {
    const cats = new Set(catalogue.map((p) => p.category).filter(Boolean));
    return ["ALL", ...Array.from(cats)].sort();
  }, [catalogue]);

  const filteredCatalogue = useMemo(() => {
    return catalogue.filter((p) => {
      const matchesSearch =
        p.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [catalogue, searchQuery, selectedCategory]);

  // --- ADD NEW TYRE ---
  async function handleAddTyre(e) {
    e.preventDefault();
    if (!newModel || !newSize || !newPrice)
      return toast.error("Please fill all details");

    setAddingTyre(true);
    const loadingToast = toast.loading("Adding new tyre...");
    
    // Auto-generate SKU from Size + Model name (strip special chars, uppercase)
    const autoSku = `APL-${(newSize + newModel).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: autoSku,
          modelName: newModel,
          size: newSize,
          category: newCategory,
          basePrice: newPrice,
          hsnCode: newHsn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Tyre added successfully!", { id: loadingToast });
      setNewModel("");
      setNewSize("");
      setNewCategory("TWO_WHEELER");
      setNewPrice("");
      setNewHsn("4011");
      loadCatalogue();
      
      // Bust Next.js client-side router cache so the Purchases page immediately shows the new tyre
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setAddingTyre(false);
    }
  }

  // --- OPEN EDIT MODAL ---
  function openEditModal(product) {
    // Clone the product data into the modal state so we can edit it safely
    setEditModal({
      isOpen: true,
      product: { ...product },
    });
  }

  // --- SAVE EDITED TYRE ---
  async function executeEdit(e) {
    e.preventDefault();
    setIsEditing(true);
    const loadingToast = toast.loading("Saving changes...");

    try {
      const res = await fetch("/api/products/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editModal.product.id,
          sku: editModal.product.sku,
          modelName: editModal.product.modelName,
          size: editModal.product.size,
          basePrice: editModal.product.basePrice,
          category: editModal.product.category,
          hsnCode: editModal.product.hsnCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Product updated!", { id: loadingToast });
      setEditModal({ isOpen: false, product: null });
      loadCatalogue();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsEditing(false);
    }
  }

  // --- DELETE TYRE ---
  async function executeDelete() {
    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting product...");
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteModal.productId }),
      });
      if (!res.ok) throw new Error("Failed to delete product");

      toast.success("Product deleted", { id: loadingToast });
      setDeleteModal({ isOpen: false, productId: null, modelName: "" });
      loadCatalogue();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#522874]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-20 md:pt-36 lg:pt-28 relative">
      {/* --- EDIT MODAL --- */}
      {editModal.isOpen && editModal.product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#522874]" /> Edit Tyre Details
              </h3>
              <button
                onClick={() => setEditModal({ isOpen: false, product: null })}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={executeEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    SKU Code
                  </label>
                  <input
                    required
                    value={editModal.product.sku}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        product: { ...editModal.product, sku: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-mono text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Model Name
                  </label>
                  <input
                    required
                    value={editModal.product.modelName}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        product: {
                          ...editModal.product,
                          modelName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-gray-900"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Size
                  </label>
                  <input
                    required
                    value={editModal.product.size}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        product: { ...editModal.product, size: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-[#522874]"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    HSN Code
                  </label>
                  <input
                    value={editModal.product.hsnCode || ""}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        product: { ...editModal.product, hsnCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-mono text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={editModal.product.category}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        product: {
                          ...editModal.product,
                          category: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white"
                  >
                    {categories
                      .filter((c) => c !== "ALL")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Base Price (₹)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={editModal.product.basePrice}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        product: {
                          ...editModal.product,
                          basePrice: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, product: null })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 px-4 py-2.5 bg-[#522874] text-white rounded-xl font-bold hover:bg-[#3d1d56] transition-colors flex justify-center items-center gap-2"
                >
                  {isEditing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}{" "}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-5 mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Delete Tyre Model?
            </h3>
            <p className="text-center text-gray-500 text-sm mb-8 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-gray-900">
                "{deleteModal.modelName}"
              </span>
              ? All physical stock records will be wiped.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    productId: null,
                    modelName: "",
                  })
                }
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex justify-center items-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}{" "}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <PackageSearch className="text-[#522874] h-8 w-8" /> Master
              Catalogue
            </h1>
            <p className="text-gray-500 mt-1">
              Manage global Apollo products and pricing.
            </p>
          </div>
          <Link
            href="/inventory/manage"
            className="flex items-center gap-2 bg-[#522874] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-[#3d1d56] transition-all shadow-sm active:scale-95 w-full md:w-auto justify-center"
          >
            <ArrowRightLeft size={18} /> Manage Physical Stock
          </Link>
        </div>

        {/* --- ADD NEW TYRE FORM --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <PlusCircle className="w-5 h-5 text-green-600" /> Register New Tyre
          </h2>
          <form
            onSubmit={handleAddTyre}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Model Name
              </label>
              <input
                required
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Amazer 4G"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Size
              </label>
              <input
                required
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="165/80 R14"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Category
              </label>
              <select
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white"
              >
                <option value="TWO_WHEELER">Two Wheeler</option>
                <option value="THREE_WHEELER">Three Wheeler</option>
                <option value="PASSENGER_CAR">Passenger Car</option>
                <option value="PREMIUM_CAR">Premium Car</option>
                <option value="TRUCK_BUS_RADIAL">Truck/Bus Radial</option>
                <option value="TRUCK_BUS_BIAS">Truck/Bus Bias</option>
                <option value="LIGHT_COMMERCIAL">Light Commercial (LCV)</option>
                <option value="TRACTOR_FARM">Tractor/Farm</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Base Price (₹)
              </label>
              <input
                required
                type="number"
                min="1"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="3200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                HSN Code
              </label>
              <input
                value={newHsn}
                onChange={(e) => setNewHsn(e.target.value)}
                placeholder="4011"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={addingTyre}
              className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex justify-center items-center h-[42px] sm:col-span-2 md:col-span-1"
            >
              {addingTyre ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save"
              )}
            </button>
          </form>
        </div>

        {/* --- TOOLBAR (SEARCH & FILTER) --- */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, Model, or Size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none bg-white cursor-pointer appearance-none font-medium text-gray-700"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "All Categories" : cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- MOBILE-RESPONSIVE DATA TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            {/* Desktop Header (Hidden on Mobile) */}
            <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Tyre Details
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  Base Price
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  Global Stock
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body (Turns into Stacked Cards on Mobile) */}
            <tbody className="block md:table-row-group">
              {filteredCatalogue.length === 0 && (
                <tr className="block md:table-row">
                  <td
                    colSpan="5"
                    className="block md:table-cell p-8 text-center text-gray-500 border-b"
                  >
                    No tyres found matching your filters.
                  </td>
                </tr>
              )}

              {filteredCatalogue.map((product) => {
                const totalStock =
                  product.inventories?.reduce(
                    (acc, inv) => acc + inv.quantity,
                    0,
                  ) || 0;

                return (
                  <tr
                    key={product.id}
                    className="block md:table-row border-b border-gray-100 hover:bg-purple-50/10 transition-colors p-4 md:p-0"
                  >
                    {/* Details */}
                    <td className="block md:table-cell md:p-4 mb-2 md:mb-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg md:text-base">
                          {product.modelName}{" "}
                          <span className="text-[#522874] font-semibold">
                            ({product.size})
                          </span>
                        </span>
                        <code className="text-xs text-gray-400 font-mono mt-0.5">
                          SKU: {product.sku}
                        </code>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="block md:table-cell md:p-4 mb-2 md:mb-0">
                      <div className="flex justify-between md:block items-center">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                          Category:
                        </span>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded uppercase">
                          {product.category?.replace(/_/g, " ") || "GENERAL"}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="block md:table-cell md:p-4 md:text-right mb-2 md:mb-0">
                      <div className="flex justify-between md:justify-end items-center">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                          Base Price:
                        </span>
                        <span className="font-bold text-gray-900">
                          ₹{product.basePrice.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="block md:table-cell md:p-4 md:text-center mb-4 md:mb-0">
                      <div className="flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                          Total Stock:
                        </span>
                        <span
                          className={`inline-block px-3 py-1 rounded-md font-black text-sm ${totalStock <= product.lowStock ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {totalStock}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="block md:table-cell md:p-4 md:text-right border-t md:border-none pt-4 md:pt-0">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 md:py-1.5 rounded text-sm md:text-xs font-bold transition-colors"
                        >
                          <Edit className="w-4 h-4 md:w-3.5 md:h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              productId: product.id,
                              modelName: product.modelName,
                            })
                          }
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 md:py-1.5 rounded text-sm md:text-xs font-bold transition-colors"
                        >
                          <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />{" "}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

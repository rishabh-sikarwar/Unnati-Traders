"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  PackageSearch,
  PlusCircle,
  Save,
  Trash2,
  Loader2,
  ArrowRightLeft,
  AlertTriangle,
} from "lucide-react";

export default function StockPage() {
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Tyre Form State
  const [newSku, setNewSku] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addingTyre, setAddingTyre] = useState(false);

  // Custom Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    modelName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadCatalogue() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      // Attach local state to each row so they can be edited independently
      const formattedData = data.map((product) => ({
        ...product,
        editModelName: product.modelName,
        editSize: product.size,
        editPrice: product.basePrice,
      }));

      setCatalogue(formattedData);
    } catch (error) {
      toast.error("Failed to load catalogue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalogue();
  }, []);

  // --- ADD NEW TYRE ---
  async function handleAddTyre(e) {
    e.preventDefault();
    if (!newSku || !newModel || !newSize || !newPrice) {
      return toast.error("Please fill all tyre details");
    }

    setAddingTyre(true);
    const loadingToast = toast.loading("Adding new tyre to catalogue...");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newSku,
          modelName: newModel,
          size: newSize,
          basePrice: newPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Tyre added successfully! It is now available to stock.", {
        id: loadingToast,
      });
      setNewSku("");
      setNewModel("");
      setNewSize("");
      setNewPrice("");
      loadCatalogue(); // Refresh table
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setAddingTyre(false);
    }
  }

  // --- UPDATE PRODUCT DETAILS (Price, Name, Size) ---
  async function updateProductDetails(index) {
    const product = catalogue[index];
    const loadingToast = toast.loading("Saving changes...");

    try {
      const res = await fetch("/api/products/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          modelName: product.editModelName,
          size: product.editSize,
          basePrice: product.editPrice,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Product updated!", { id: loadingToast });
      loadCatalogue();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    }
  }

  // --- INITIATE DELETE (Opens Modal) ---
  function confirmDeletePopup(productId, modelName) {
    setDeleteModal({ isOpen: true, productId, modelName });
  }

  // --- EXECUTE PERMANENT DELETE ---
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

      toast.success("Product permanently deleted", { id: loadingToast });
      setDeleteModal({ isOpen: false, productId: null, modelName: "" }); // Close Modal
      loadCatalogue(); // Refresh data
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  }

  // --- HANDLE LOCAL ROW STATE CHANGES ---
  const handleRowChange = (index, field, value) => {
    const newCatalogue = [...catalogue];
    newCatalogue[index][field] = value;
    setCatalogue(newCatalogue);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#522874]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-8 pt-28 md:pt-32 relative">
      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
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
                </span>{" "}
                from the database? This will also wipe out ALL existing physical
                stock records for this tyre across all shops. <br />
                <br />
                <span className="text-red-500 font-semibold">
                  This action cannot be undone.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: false,
                      productId: null,
                      modelName: "",
                    })
                  }
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 cursor-pointer shadow-sm shadow-red-200"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Yes, Delete It
                </button>
              </div>
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
              <PackageSearch className="text-[#522874] h-8 w-8" />
              Master Tyre Catalogue
            </h1>
            <p className="text-gray-500 mt-1">
              Add new Apollo products and edit base pricing.
            </p>
          </div>

          <Link
            href="/inventory/manage"
            className="flex items-center gap-2 bg-[#522874] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-[#3d1d56] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowRightLeft size={18} />
            Manage Physical Stock
          </Link>
        </div>

        {/* --- ADD NEW TYRE FORM --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <PlusCircle className="w-5 h-5 text-green-600" /> Register New Tyre
          </h2>
          <form
            onSubmit={handleAddTyre}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                SKU
              </label>
              <input
                required
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="e.g. APL-AMZ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Model Name
              </label>
              <input
                required
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Amazer 4G"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Base Price (₹)
              </label>
              <input
                required
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="3200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={addingTyre}
              className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white py-2 rounded-lg font-bold transition-all disabled:opacity-50 flex justify-center items-center h-[42px] cursor-pointer active:scale-95"
            >
              {addingTyre ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save to Catalogue"
              )}
            </button>
          </form>
        </div>

        {/* --- UNIFIED DATA TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                    SKU Code
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                    Product Details (Editable)
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[150px]">
                    Base Price
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    Network Stock
                  </th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {catalogue.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No products found in catalogue.
                    </td>
                  </tr>
                )}

                {catalogue.map((product, index) => {
                  // Calculate Total Stock across all shops for this specific tyre
                  const totalStock =
                    product.inventories?.reduce(
                      (acc, inv) => acc + inv.quantity,
                      0,
                    ) || 0;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-gray-50 hover:bg-purple-50/10 transition-colors"
                    >
                      {/* SKU */}
                      <td className="p-4 font-mono text-xs text-gray-500 bg-gray-50/50">
                        {product.sku}
                      </td>

                      {/* Editable Product Details */}
                      <td className="p-4 space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={product.editModelName}
                            onChange={(e) =>
                              handleRowChange(
                                index,
                                "editModelName",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 text-sm font-bold text-gray-900 border border-transparent hover:border-gray-300 focus:border-[#522874] rounded outline-none transition-all"
                          />
                          <input
                            value={product.editSize}
                            onChange={(e) =>
                              handleRowChange(index, "editSize", e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm font-semibold text-[#522874] border border-transparent hover:border-gray-300 focus:border-[#522874] rounded outline-none transition-all"
                          />
                        </div>
                      </td>

                      {/* Editable Price */}
                      <td className="p-4 flex items-center gap-1 mt-1">
                        <span className="text-gray-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={product.editPrice}
                          onChange={(e) =>
                            handleRowChange(index, "editPrice", e.target.value)
                          }
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#522874]"
                        />
                      </td>

                      {/* Read-Only Total Stock */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-md font-black text-sm ${totalStock <= product.lowStock ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {totalStock}
                        </span>
                      </td>

                      {/* Actions (Save & Delete) */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateProductDetails(index)}
                            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer"
                            title="Save Edits"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>

                          <button
                            onClick={() =>
                              confirmDeletePopup(product.id, product.modelName)
                            }
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer"
                            title="Permanently Delete Tyre"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
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
    </div>
  );
}

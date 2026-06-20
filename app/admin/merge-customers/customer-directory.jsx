"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function CustomerDirectory({ customers, page, query: initialQuery, type: initialType, totalCount, take }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialQuery);
  const [type, setType] = useState(initialType);

  // Modal States
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    type: "RETAIL",
    address: "",
    gstNumber: "",
  });

  // Sync state if initial values change (e.g. back/forward navigation)
  useEffect(() => {
    setSearch(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  // Sync edit form state when editingCustomer changes
  useEffect(() => {
    if (editingCustomer) {
      setEditForm({
        name: editingCustomer.name || "",
        phone: editingCustomer.phone === "—" ? "" : editingCustomer.phone || "",
        email: editingCustomer.email === "—" ? "" : editingCustomer.email || "",
        type: editingCustomer.type || "RETAIL",
        address: editingCustomer.address === "—" ? "" : editingCustomer.address || "",
        gstNumber: editingCustomer.gstNumber === "—" ? "" : editingCustomer.gstNumber || "",
      });
    }
  }, [editingCustomer]);

  const updateUrl = (newQuery, newType, newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newQuery) {
      params.set("query", newQuery);
    } else {
      params.delete("query");
    }

    if (newType && newType !== "ALL") {
      params.set("type", newType);
    } else {
      params.delete("type");
    }

    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const debouncedSearch = useDebouncedCallback((val) => {
    updateUrl(val, type, 1);
  }, 400);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    debouncedSearch(val);
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setType(val);
    updateUrl(search, val, 1);
  };

  const handlePageChange = (newPage) => {
    updateUrl(search, type, newPage);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("Updating customer profile...");

    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update customer");

      toast.success("Customer profile updated successfully!", { id: toastId });
      setEditingCustomer(null);
      router.refresh();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Deleting customer account...");

    try {
      const res = await fetch(`/api/customers/${deletingCustomer.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete customer");

      toast.success("Customer deleted successfully!", { id: toastId });
      setDeletingCustomer(null);
      router.refresh();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / take) || 1;

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search name or phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-gray-700 placeholder-gray-400 transition-all text-sm"
          />
        </div>
        <div>
          <select
            value={type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-gray-700 bg-white transition-all text-sm cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="SUB_DEALER">Sub Dealer</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
      </div>

      {/* Table View Wrapper */}
      <div className="w-full overflow-x-auto rounded-lg shadow-sm border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Phone</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Type</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                    {c.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {c.phone}
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {c.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      c.type === "RETAIL" 
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : c.type === "SUB_DEALER"
                        ? "bg-purple-50 text-purple-700 border border-purple-100"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    }`}>
                      {c.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCustomer(c)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-purple-700 transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCustomer(c)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic font-semibold">
                  No customers found matching the search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-500">
            Showing Page {page} of {totalPages} ({totalCount} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Customer Profile
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-sm text-gray-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-sm text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Customer Type
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm text-gray-700 bg-white"
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="SUB_DEALER">Sub Dealer</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.gstNumber}
                    onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-sm text-gray-700 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Address
                </label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-sm text-gray-700 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 mb-5 mx-auto border border-rose-200">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>

            <h3 className="text-xl font-bold text-center text-gray-900 mb-3">
              Delete Customer Account
            </h3>
            
            <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">"{deletingCustomer.name}"</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold hover:shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

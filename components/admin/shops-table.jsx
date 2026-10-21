"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Edit, Trash2, Loader2, X, Save, MapPin, UploadCloud, QrCode } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";

export default function ShopsTable({ shops }) {
  const router = useRouter();

  // Edit Modal States
  const [editModal, setEditModal] = useState({ isOpen: false, shop: null });
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteLoading, setDeleteLoading] = useState(null);

  // --- HANDLE UPDATE ---
  async function executeEdit(e) {
    e.preventDefault();
    setIsSaving(true);
    const loadingToast = toast.loading("Updating shop details...");

    try {
      const res = await fetch("/api/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editModal.shop.id,
          name: editModal.shop.name,
          address: editModal.shop.address,
          upiId: editModal.shop.upiId || "",
          upiQrUrl: editModal.shop.upiQrUrl || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Shop updated successfully!", { id: loadingToast });
      setEditModal({ isOpen: false, shop: null });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  }

  // --- HANDLE DELETE ---
  async function executeDelete(id, name) {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${name}"?`,
    );
    if (!confirmDelete) return;

    setDeleteLoading(id);
    const loadingToast = toast.loading("Deleting shop...");

    try {
      const res = await fetch("/api/locations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Location deleted", { id: loadingToast });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setDeleteLoading(null);
    }
  }

  return (
    <>
      {/* --- EDIT MODAL --- */}
      {editModal.isOpen && editModal.shop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#522874]" /> Edit Shop Details
              </h3>
              <button
                onClick={() => setEditModal({ isOpen: false, shop: null })}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={executeEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Shop Name
                </label>
                <input
                  required
                  value={editModal.shop.name}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      shop: { ...editModal.shop, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={editModal.shop.address || ""}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        shop: { ...editModal.shop, address: e.target.value },
                      })
                    }
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  UPI ID / VPA (Optional)
                </label>
                <input
                  placeholder="e.g. 9425126868@okbizaxis"
                  value={editModal.shop.upiId || ""}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      shop: { ...editModal.shop, upiId: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] outline-none text-gray-900 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Shop UPI QR Code Image (Admin Only)
                </label>
                {editModal.shop.upiQrUrl ? (
                  <div className="relative inline-block border p-2 rounded-lg bg-gray-50 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editModal.shop.upiQrUrl}
                      alt="Shop QR Code"
                      className="w-24 h-24 object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditModal({
                          ...editModal,
                          shop: { ...editModal.shop, upiQrUrl: "" },
                        })
                      }
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors cursor-pointer"
                      title="Remove QR code"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <CldUploadWidget
                    uploadPreset="unnati_uploads"
                    onSuccess={(result) => {
                      if (result?.info?.secure_url) {
                        setEditModal({
                          ...editModal,
                          shop: {
                            ...editModal.shop,
                            upiQrUrl: result.info.secure_url,
                          },
                        });
                        toast.success("QR Code uploaded successfully!");
                      }
                    }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-purple-300 transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-6 h-6 mb-2 text-[#522874]" />
                        <span className="text-sm font-medium">Click to upload QR Code</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, or SVG</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, shop: null })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-[#522874] text-white rounded-xl font-bold hover:bg-[#3d1d56] transition-colors flex justify-center items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Shop Info
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {shops.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500">
                  No shops found.
                </td>
              </tr>
            ) : (
              shops.map((shop) => (
                <tr
                  key={shop.id}
                  className="block md:table-row border-b border-gray-100 hover:bg-purple-50/10 p-4 md:p-0"
                >
                  <td className="block md:table-cell md:p-4 mb-2 md:mb-0">
                    <div className="flex items-center gap-3">
                      {shop.upiQrUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={shop.upiQrUrl}
                          alt="QR Code"
                          className="w-10 h-10 object-contain rounded border border-gray-200 bg-gray-50 shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-bold text-gray-900 text-lg md:text-base">
                          {shop.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />{" "}
                          {shop.address || "No address provided"}
                        </div>
                        {shop.upiId && (
                          <div className="text-[11px] text-[#522874] font-mono font-semibold mt-0.5">
                            UPI: {shop.upiId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${shop.type === "WAREHOUSE" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {shop.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="block md:table-cell md:p-4 md:text-right border-t md:border-none pt-4 md:pt-0">
                    <div className="flex flex-col sm:flex-row md:justify-end gap-2">
                      <button
                        onClick={() => setEditModal({ isOpen: true, shop })}
                        className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => executeDelete(shop.id, shop.name)}
                        disabled={deleteLoading === shop.id}
                        className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-bold transition-colors active:scale-95 disabled:opacity-50"
                      >
                        {deleteLoading === shop.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

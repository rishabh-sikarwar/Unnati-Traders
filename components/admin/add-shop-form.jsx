"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PlusCircle, Loader2, UploadCloud, X } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";

export default function AddShopForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("retail_shop"); // Value should match Prisma enum/logic exactly
  const [upiId, setUpiId] = useState("");
  const [upiQrUrl, setUpiQrUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function createShop(e) {
    e.preventDefault();
    if (!name || !address) return toast.error("Please fill all required fields");

    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, type, upiId, upiQrUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create shop");
      }

      toast.success("Shop added successfully!");
      setName("");
      setAddress("");
      setUpiId("");
      setUpiQrUrl("");
      router.refresh(); // Instantly updates the server component table without blinking!
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={createShop}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Shop Name *
          </label>
          <input
            required
            placeholder="e.g. Main Warehouse"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none transition-all text-sm font-medium"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="w-full md:w-1/3">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Address *
          </label>
          <input
            required
            placeholder="e.g. Gwalior Bypass"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none transition-all text-sm font-medium"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="w-full md:w-1/3">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Type *
          </label>
          <select
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none transition-all cursor-pointer bg-white text-sm font-medium"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="retail_shop">Retail Shop</option>
            <option value="warehouse">Warehouse</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100 items-start">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            UPI ID / VPA (Optional)
          </label>
          <input
            placeholder="e.g. 9425126868@okbizaxis"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none transition-all font-mono text-sm"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase">
            Shop UPI QR Code Image (Admin Only)
          </label>
          {upiQrUrl ? (
            <div className="relative inline-block border p-2 rounded-lg bg-gray-50 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={upiQrUrl}
                alt="Uploaded QR Code"
                className="w-20 h-20 object-contain rounded"
              />
              <button
                type="button"
                onClick={() => setUpiQrUrl("")}
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
                  setUpiQrUrl(result.info.secure_url);
                  toast.success("QR Code uploaded successfully!");
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-gray-500 hover:bg-purple-50/50 hover:border-[#522874] transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 mb-1 text-[#522874]" />
                  <span className="text-xs font-semibold text-gray-700">Click to upload QR Code</span>
                  <span className="text-[10px] text-gray-400">PNG, JPG, or SVG</span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </div>

        <div className="flex items-end h-full">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white px-6 py-2.5 rounded-lg font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            Create Shop
          </button>
        </div>
      </div>
    </form>
  );
}

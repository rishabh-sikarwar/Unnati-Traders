"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PlusCircle, Loader2 } from "lucide-react";

export default function AddShopForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("retail_shop"); // Value should match Prisma enum/logic exactly
  const [loading, setLoading] = useState(false);

  async function createShop(e) {
    e.preventDefault();
    if (!name || !address) return toast.error("Please fill all fields");

    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        body: JSON.stringify({ name, address, type }),
      });

      if (!res.ok) throw new Error("Failed to create shop");

      toast.success("Shop added successfully!");
      setName("");
      setAddress("");
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
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end"
    >
      <div className="w-full md:w-1/3">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Shop Name
        </label>
        <input
          required
          placeholder="e.g. Main Warehouse"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none transition-all"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="w-full md:w-1/3">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Address
        </label>
        <input
          required
          placeholder="e.g. Gwalior Bypass"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none transition-all"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="w-full md:w-1/4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Type
        </label>
        <select
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#522874] focus:border-transparent outline-none transition-all cursor-pointer bg-white"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="retail_shop">Retail Shop</option>
          <option value="warehouse">Warehouse</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full md:w-auto bg-[#522874] hover:bg-[#3d1d56] text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <PlusCircle className="w-4 h-4" />
        )}
        Create
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";

export default function UpdateUser({ user, locations }) {
  const router = useRouter();

  // Initialize state with current database values
  const [mobile, setMobile] = useState(user.mobile || "");
  const [role, setRole] = useState(user.role || "VISITOR");
  const [selectedLocationId, setSelectedLocationId] = useState(
    user.locationId || "",
  );
  const [loading, setLoading] = useState(false);

  async function updateUser() {
    setLoading(true);
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mobile,
          role,
          // If empty string, send null to remove the shop assignment
          locationId: selectedLocationId === "" ? null : selectedLocationId,
        }),
      });

      if (!res.ok) throw new Error("Failed to update user profile");

      toast.success(`${user.fullName || "User"}'s profile updated!`);
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Mobile Input */}
      <input
        type="tel"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        className="w-32 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#522874] outline-none transition-all"
        placeholder="Phone No."
      />

      {/* Role Selector (Prisma Enums) */}
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-36 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#522874] outline-none transition-all bg-white cursor-pointer font-medium"
      >
        <option value="ADMIN">Admin</option>
        <option value="SHOPKEEPER">Shopkeeper</option>
        <option value="DEALER">Dealer</option>
        <option value="VISITOR">Visitor</option>
      </select>

      {/* Location Selector */}
      <select
        value={selectedLocationId}
        onChange={(e) => setSelectedLocationId(e.target.value)}
        className="w-48 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-[#522874] outline-none transition-all bg-white cursor-pointer"
      >
        <option value="">-- No Shop Assigned --</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>

      {/* Save Button */}
      <button
        onClick={updateUser}
        disabled={loading}
        className="bg-[#522874] hover:bg-[#3d1d56] text-white p-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 shadow-sm active:scale-95"
        title="Save Changes"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";

export default function UpdateUser({ user, locations }) {
  const router = useRouter();
  const [mobile, setMobile] = useState(user.mobile || "");
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
          locationId: selectedLocationId,
        }),
      });

      if (!res.ok) throw new Error("Failed to update user");

      toast.success(`${user.fullName || "User"}'s profile updated!`);
      router.refresh(); // Silently refreshes the table row
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col xl:flex-row items-center gap-2">
      <input
        type="tel"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        className="w-full xl:w-32 border border-gray-300 px-3 py-1.5 rounded-md text-sm outline-none"
        placeholder="Phone No."
      />

      <select
        value={selectedLocationId}
        onChange={(e) => setSelectedLocationId(e.target.value)}
        className="w-full xl:w-40 border border-gray-300 px-3 py-1.5 rounded-md text-sm outline-none bg-white cursor-pointer"
      >
        <option value="">Unassigned</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>

      <button
        onClick={updateUser}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center w-8 h-8"
        title="Save Changes"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function UpdateUser({ user, locations }) {
  const [mobile, setMobile] = useState(user.mobile || "");
  const [location, setLocation] = useState(user.locationId || "");

  async function updateUser() {
    await fetch("/api/users/update", {
      method: "POST",

      body: JSON.stringify({
        userId: user.id,
        mobile,
        locationId: location,
      }),
    });

    location.reload();
  }

  return (
    <div className="flex gap-2">
      <input
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        className="border p-1 rounded"
        placeholder="Mobile"
      />

      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border p-1 rounded"
      >
        <option value="">No Shop</option>

        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>

      <button
        onClick={updateUser}
        className="bg-green-600 text-white px-3 rounded"
      >
        Save
      </button>
    </div>
  );
}

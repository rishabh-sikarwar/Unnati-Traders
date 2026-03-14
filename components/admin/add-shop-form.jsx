"use client";

import { useState } from "react";

export default function AddShopForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("RETAIL_SHOP");

  async function createShop() {
    await fetch("/api/locations", {
      method: "POST",
      body: JSON.stringify({
        name,
        address,
        type,
      }),
    });

    location.reload();
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-lg font-semibold">Add New Shop</h2>

      <input
        placeholder="Shop Name"
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Address"
        className="input"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <select
        className="input"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="RETAIL_SHOP">Retail Shop</option>
        <option value="WAREHOUSE">Warehouse</option>
      </select>

      <button
        onClick={createShop}
        className="bg-purple-700 text-white px-4 py-2 rounded"
      >
        Create Shop
      </button>
    </div>
  );
}

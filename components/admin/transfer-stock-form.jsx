"use client";

import { useState } from "react";

export default function TransferStockForm({ products, locations }) {
  const [productId, setProductId] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [quantity, setQuantity] = useState(0);

  async function transferStock() {
    if (fromLocation === toLocation) {
      alert("Source and destination shop cannot be the same.");
      return;
    }

    const res = await fetch("/api/transfer-stock", {
      method: "POST",
      body: JSON.stringify({
        productId,
        fromLocation,
        toLocation,
        quantity: Number(quantity),
      }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    alert("Stock transferred successfully");
    location.reload();
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-lg font-semibold">Transfer Tyres</h2>

      {/* PRODUCT */}
      <select
        className="input"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      >
        <option value="">Select Tyre</option>

        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.modelName} ({p.size})
          </option>
        ))}
      </select>

      {/* FROM */}
      <select
        className="input"
        value={fromLocation}
        onChange={(e) => setFromLocation(e.target.value)}
      >
        <option value="">From Shop</option>

        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      {/* TO */}
      <select
        className="input"
        value={toLocation}
        onChange={(e) => setToLocation(e.target.value)}
      >
        <option value="">To Shop</option>

        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      {/* QUANTITY */}
      <input
        type="number"
        className="input"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <button
        onClick={transferStock}
        className="bg-purple-700 text-white px-4 py-2 rounded"
      >
        Transfer Stock
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function UpdateStock({ productId, locationId }) {
  const [qty, setQty] = useState(0);

  async function update(type) {
    await fetch("/api/inventory/update", {
      method: "POST",

      body: JSON.stringify({
        productId,
        locationId,
        quantity: qty,
        type,
      }),
    });

    location.reload();
  }

  return (
    <div className="flex gap-2">
      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-20 border rounded p-1"
      />

      <Button onClick={() => update("add")} className="bg-green-600">
        +
      </Button>

      <Button onClick={() => update("remove")} className="bg-red-600">
        -
      </Button>
    </div>
  );
}

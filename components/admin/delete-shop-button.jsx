"use client";

export default function DeleteShopButton({ id }) {

  async function deleteShop() {

    const confirmDelete = confirm("Delete this shop?");

    if (!confirmDelete) return;

    await fetch("/api/locations", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    location.reload();
  }

  return (
    <button
      onClick={deleteShop}
      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
    >
      Delete
    </button>
  );
}
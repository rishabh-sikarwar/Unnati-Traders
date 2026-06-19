"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

export const SearchUsers = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm max-w-xl mb-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const queryTerm = formData.get("search");
          router.push(pathname + "?search=" + queryTerm);
        }}
        className="flex flex-col sm:flex-row gap-3 items-end sm:items-center"
      >
        <div className="flex-1 w-full">
          <label htmlFor="search" className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
            Search for users
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="search"
              name="search"
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-sm hover:shadow active:scale-95 transition-all text-sm shrink-0 h-[42px] flex items-center justify-center cursor-pointer"
        >
          Search
        </button>
      </form>
    </div>
  );
};

"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Printer, FileText } from "lucide-react";
import { format } from "date-fns";

export default function OrdersTable({ initialOrders, userRole }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = initialOrders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const invMatch = order.invoiceNumber.toLowerCase().includes(query);
    const nameMatch = order.customer?.name?.toLowerCase().includes(query);
    const phoneMatch = order.customer?.phone?.toLowerCase().includes(query);

    return invMatch || nameMatch || phoneMatch;
  });

  return (
    <div className="space-y-6">
      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-7" />
        <input
          type="text"
          placeholder="Search by Invoice Number, Customer Name, or Phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border-none outline-none focus:ring-0 text-gray-700 font-medium bg-transparent"
        />
      </div>

      {/* MOBILE-RESPONSIVE ORDERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          {/* Desktop Header */}
          <thead className="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Invoice Details
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              {userRole === "ADMIN" && (
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
              )}
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Grand Total
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            {filteredOrders.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan={userRole === "ADMIN" ? 6 : 5}
                  className="block md:table-cell p-10 text-center text-gray-500"
                >
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-bold">No invoices found.</p>
                  <p className="text-sm">
                    Generate a bill in the Billing section to see it here.
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="block md:table-row border-b border-gray-100 hover:bg-purple-50/10 transition-colors p-4 md:p-0"
                >
                  {/* DATE */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Date:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-gray-800">
                          {format(new Date(order.createdAt), "dd MMM yyyy")}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                          {format(new Date(order.createdAt), "hh:mm a")}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* INVOICE INFO */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Invoice:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-[#522874]">
                          {order.invoiceNumber}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                          {order._count.items}{" "}
                          {order._count.items === 1 ? "Item" : "Items"}
                        </div>
                        <span className="inline-block mt-1 md:mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase tracking-wider">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                    <div className="flex justify-between md:block items-start">
                      <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                        Customer:
                      </span>
                      <div className="text-right md:text-left">
                        <div className="font-bold text-gray-900">
                          {order.customer?.name || "Walk-in"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {order.customer?.phone || "No Phone"}
                        </div>
                        {order.customer?.type === "SUB_DEALER" && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">
                            B2B DEALER
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SHOP (Admins Only) */}
                  {userRole === "ADMIN" && (
                    <td className="block md:table-cell md:p-4 mb-3 md:mb-0">
                      <div className="flex justify-between md:block items-center">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase">
                          Shop:
                        </span>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded uppercase tracking-wide">
                          {order.location?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* TOTAL */}
                  <td className="block md:table-cell md:p-4 md:text-right mb-4 md:mb-0 bg-gray-50 md:bg-transparent rounded-lg p-3 md:p-0">
                    <div className="flex justify-between md:justify-end items-center">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                        Grand Total:
                      </span>
                      <div className="text-lg md:text-xl font-black text-green-600">
                        ₹
                        {order.grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="block md:table-cell md:p-4 md:text-right border-t md:border-none pt-4 md:pt-0">
                    <Link
                      href={`/billing/receipt/${order.id}`}
                      className="flex items-center justify-center md:justify-end gap-1.5 bg-[#522874] hover:bg-[#3d1d56] text-white px-3 py-2.5 md:py-2 rounded-lg text-sm font-bold transition-colors shadow-sm active:scale-95 w-full md:w-auto"
                    >
                      <Printer className="w-4 h-4" /> View / Print
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

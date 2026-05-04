"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Undo2,
  Loader2,
  MapPin,
  User,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";

export default function ShopkeeperDashboard({ user }) {
  const [loadingHref, setLoadingHref] = useState(null);

  const shopName = user?.location?.name || "Unassigned Shop";
  const shopAddress =
    user?.location?.address || "Address not provided in system.";
  const shopkeeperName = user?.fullName || "Shopkeeper";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // The shopkeeper's non-navbar workflow shortcuts
  const quickLinks = [
    {
      title: "Purchase Bills",
      subtitle: "View inward bills for your own shop only",
      icon: FileText,
      href: "/purchases/ledger",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      border: "hover:border-cyan-400",
      shadow: "hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)]",
    },
    {
      title: "Tyres Inventory",
      subtitle: "Check stock and add new tyres to your shop",
      icon: MapPin,
      href: "/stock",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "hover:border-yellow-400",
      shadow: "hover:shadow-[0_8px_30px_rgba(234,179,8,0.15)]",
    },
    {
      title: "Process Returns",
      subtitle: "Handle defective Apollo tyre claims",
      icon: Undo2,
      href: "/returns",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "hover:border-rose-400",
      shadow: "hover:shadow-[0_8px_30px_rgba(225,29,72,0.15)]",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-12 pt-24 md:pt-32 lg:pt-36">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* --- PREMIUM HEADER --- */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-black text-[#522874] uppercase tracking-widest bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 flex items-center gap-1.5 shadow-sm">
                <User className="w-3.5 h-3.5" /> Welcome, {shopkeeperName}
              </span>
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5" /> {today}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none mb-2.5">
              {shopName}
            </h1>

            <p className="text-gray-500 flex items-start sm:items-center gap-2 font-medium max-w-2xl text-sm md:text-base">
              <MapPin className="w-4 h-4 text-purple-500 shrink-0 mt-0.5 sm:mt-0" />
              {shopAddress}
            </p>
          </div>

          <div className="bg-green-50 text-green-700 px-5 py-3 rounded-2xl font-black text-sm border border-green-200 flex items-center gap-3 shadow-inner relative z-10">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
            Shop Active
          </div>
        </div>

        {/* --- 6-GRID COMMAND CENTER --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3ror gap-5 md:gap-6">
          {quickLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => setLoadingHref(link.href)}
              className="block outline-none"
            >
              <Card
                className={`group relative h-full bg-white border-2 border-transparent transition-all duration-300 ease-out hover:-translate-y-1.5 overflow-hidden ${link.border} ${link.shadow}`}
              >
                {/* Background Hover Effect */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-transparent to-${link.color.split("-")[1]}-50/30`}
                />

                <CardContent className="p-6 md:p-8 flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl ${link.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm border border-white`}
                    >
                      {loadingHref === link.href ? (
                        <Loader2
                          className={`w-7 h-7 animate-spin ${link.color}`}
                        />
                      ) : (
                        <link.icon className={`w-7 h-7 ${link.color}`} />
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className={`w-4 h-4 ${link.color}`} />
                    </div>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-xl font-black text-gray-900 mb-1.5 group-hover:text-gray-900 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 leading-snug">
                      {link.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingCart,
  Package,
  PackagePlus,
  Undo2,
  Loader2,
  MapPin,
  ScrollText,
  User,
  Clock
} from "lucide-react";

export default function ShopkeeperDashboard({ user }) {
  const [loadingHref, setLoadingHref] = useState(null);
  
  // Dynamically pull the exact data from the logged-in user
  const shopName = user?.location?.name || "Unassigned Shop";
  const shopAddress = user?.location?.address || "Address not provided in system.";
  const shopkeeperName = user?.fullName || "Shopkeeper";

  // Get current date for a nice daily touch
  const today = new Date().toLocaleDateString("en-IN", { 
    weekday: 'long', month: 'long', day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-12 pt-24 md:pt-32 lg:pt-36">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- UPGRADED PREMIUM HEADER --- */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black text-[#522874] uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Welcome, {shopkeeperName}
              </span>
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {today}
              </span>
            </div>
            
            {/* The H1 is now the Shop Name */}
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none mb-2">
              {shopName}
            </h1>
            
            {/* The Subtitle is now the Shop Address */}
            <p className="text-gray-500 flex items-start sm:items-center gap-2 font-medium max-w-2xl">
              <MapPin className="w-4 h-4 text-purple-500 shrink-0 mt-0.5 sm:mt-0" /> 
              {shopAddress}
            </p>
          </div>
          
          <div className="bg-green-50 text-green-700 px-5 py-2.5 rounded-xl font-bold text-sm border border-green-200 flex items-center gap-2.5 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> 
            Shop Online & Active
          </div>
        </div>

        {/* --- PRIMARY ACTION CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/inventory" onClick={() => setLoadingHref("/inventory")}>
            <Card className="cursor-pointer group hover:shadow-xl hover:border-purple-400 border-2 border-transparent transition-all duration-300 hover:-translate-y-1.5 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div>
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1.5">
                    Check Stock
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-[#522874] transition-colors">
                    Inventory Hub
                  </h3>
                </div>
                {loadingHref === "/inventory" ? (
                  <Loader2 className="text-[#522874] w-12 h-12 animate-spin shrink-0 ml-4" />
                ) : (
                  <div className="p-4 bg-purple-50 rounded-2xl group-hover:bg-[#522874] group-hover:text-white text-[#522874] transition-all duration-300">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/purchases" onClick={() => setLoadingHref("/purchases")}>
            <Card className="cursor-pointer group hover:shadow-xl hover:border-blue-400 border-2 border-transparent transition-all duration-300 hover:-translate-y-1.5 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1.5">
                    Incoming
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-blue-700 transition-colors">
                    Receive Stock
                  </h3>
                </div>
                {loadingHref === "/purchases" ? (
                  <Loader2 className="text-blue-600 w-12 h-12 animate-spin shrink-0 ml-4" />
                ) : (
                  <div className="p-4 bg-blue-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white text-blue-600 transition-all duration-300">
                    <PackagePlus className="w-8 h-8" />
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/billing" onClick={() => setLoadingHref("/billing")}>
            <Card className="cursor-pointer group hover:shadow-xl hover:border-green-400 border-2 border-transparent transition-all duration-300 hover:-translate-y-1.5 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div>
                  <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1.5">
                    Outgoing
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-green-700 transition-colors">
                    New Sale Bill
                  </h3>
                </div>
                {loadingHref === "/billing" ? (
                  <Loader2 className="text-green-600 w-12 h-12 animate-spin shrink-0 ml-4" />
                ) : (
                  <div className="p-4 bg-green-50 rounded-2xl group-hover:bg-green-500 group-hover:text-white text-green-600 transition-all duration-300">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* --- SECONDARY SETTINGS --- */}
        <h3 className="font-bold text-gray-400 uppercase tracking-widest text-sm pt-4">Daily Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {[
            {
              title: "Today's Sales Register",
              subtitle: "View previously generated bills",
              icon: ScrollText,
              href: "/orders",
              color: "text-blue-600",
              bg: "bg-blue-50 hover:bg-blue-100 border-blue-100",
            },
            {
              title: "Process Warranty/Return",
              subtitle: "Handle defective Apollo claims",
              icon: Undo2,
              href: "/returns",
              color: "text-rose-600",
              bg: "bg-rose-50 hover:bg-rose-100 border-rose-100",
            },
          ].map((card, idx) => (
            <Link key={idx} href={card.href} onClick={() => setLoadingHref(card.href)}>
              <Card className={`cursor-pointer transition-all duration-300 shadow-sm border ${card.bg} group`}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-white shadow-sm ${card.color}`}>
                      {loadingHref === card.href ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <card.icon className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{card.title}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{card.subtitle}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-gray-400 group-hover:text-gray-900 font-black transition-colors">
                    &rarr;
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
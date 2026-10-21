"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, ShoppingBag } from "lucide-react";
import Link from "next/link";

const VisitorDashboard = ({ user }) => {
  return (
    <div className="min-h-screen bg-gray-50 px-6 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.fullName || "Valued Customer"}!
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to Unnati Traders Wholesale & Retail Portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <ShoppingBag className="w-5 h-5 text-[#522874]" /> Place Wholesale / Tyre Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Browse live shop stock and place your first tyre booking.
              </p>
              <Link href="/store" className="block">
                <Button className="w-full bg-[#522874] hover:bg-[#432060] text-white">
                  Place Order Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-600" /> Book Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Schedule an appointment for alignment, balancing, or fitting.
              </p>
              <Button className="w-full bg-[#522874] hover:bg-[#432060]">Book Appointment</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default VisitorDashboard;


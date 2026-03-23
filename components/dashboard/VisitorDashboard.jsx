"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, ShieldCheck } from "lucide-react";

const VisitorDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-6 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600">Welcome to Unnati Traders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" /> My Warranties
                & Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View your past purchases and access digital warranty cards.
              </p>
              <Button variant="outline" className="w-full">
                View History
              </Button>
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
              <Button className="w-full bg-[#522874]">Book Appointment</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default VisitorDashboard;

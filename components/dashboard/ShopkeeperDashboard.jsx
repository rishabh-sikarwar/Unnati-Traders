"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Receipt, PlusCircle } from "lucide-react";

const ShopkeeperDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Retail Dashboard</h1>
          <p className="text-gray-600">Manage billing and local stock.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button className="h-24 text-lg bg-[#522874] hover:bg-[#3d1d56] flex flex-col gap-2">
            <PlusCircle size={24} />
            New Retail Bill
          </Button>
          <Button
            variant="outline"
            className="h-24 text-lg flex flex-col gap-2"
          >
            <Package size={24} />
            Check Local Inventory
          </Button>
          <Button
            variant="outline"
            className="h-24 text-lg flex flex-col gap-2"
          >
            <Receipt size={24} />
            Today's Invoices
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts (Your Location)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder for low stock items */}
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="font-medium">
                  Apollo Amazer 4G (165/80 R14)
                </span>
                <span className="text-red-600 font-bold">Only 2 left</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ShopkeeperDashboard;

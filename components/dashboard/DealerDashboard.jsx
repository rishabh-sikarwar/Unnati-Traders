"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, FileText, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DealerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-6 md:px-8 pb-8 pt-28 md:pt-32">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dealer Portal</h1>
          <p className="text-gray-600">
            Place bulk orders and download GST invoices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Quick Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Browse current warehouse stock and place a new bulk request.
              </p>
              <Button className="w-full bg-[#522874]">
                View Catalogue & Order
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" /> Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">ORD-2024-089</p>
                    <p className="text-xs text-gray-500">
                      20 Tyres • 12 Feb 2024
                    </p>
                  </div>
                  <Badge variant="outline" className="text-blue-600">
                    Dispatched
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default DealerDashboard;

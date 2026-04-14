import Image from "next/image";
import { ShieldCheck, Truck, Trophy, Users2 } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-[#1a0a2e] pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Driving Bhind Forward <br /> Since Day One.
          </h1>
          <p className="text-lg md:text-xl text-purple-200 font-medium">
            Unnati Traders is the most trusted name in wholesale and retail tyre
            distribution across the region.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-gray-900">Who We Are</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              As an{" "}
              <strong className="text-[#522874]">
                Authorized Apollo Tyres Distributor
              </strong>
              , Unnati Traders is committed to providing top-tier products to
              businesses, dealers, and end-consumers.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              We operate multiple warehouses and retail outlets to ensure that
              whether you are managing a fleet of trucks, running a farm, or
              simply changing your car's tyres, you have instant access to
              genuine products at the best prices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <ShieldCheck className="w-10 h-10 text-[#522874] mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">100% Authentic</h3>
              <p className="text-sm text-gray-500">
                Directly sourced from Apollo Tyres.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <Truck className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">Fast Supply</h3>
              <p className="text-sm text-gray-500">
                Massive stock ready for immediate dispatch.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <Users2 className="w-10 h-10 text-green-500 mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">B2B Network</h3>
              <p className="text-sm text-gray-500">
                Supporting hundreds of sub-dealers.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <Trophy className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="font-bold text-gray-900 mb-1">Expert Support</h3>
              <p className="text-sm text-gray-500">
                Warranty claims and technical assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

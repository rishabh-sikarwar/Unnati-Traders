"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, ArrowLeft, MapPinOff } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-20 relative">
      
      {/* Background Accent */}
      <div className="absolute top-0 w-full h-72 bg-[#522874] rounded-b-[40%] shadow-lg pointer-events-none" />
      

      {/* 404 Card */}
      <div className="relative z-10 bg-white p-10 md:p-16 rounded-3xl shadow-xl w-full max-w-2xl text-center border border-gray-100">

         <div className="mb-4 text-center text-gray-500 relative z-10 font-medium">
        Redirecting automatically in <span className="font-bold text-[#522874]">{countdown}</span> seconds...
      </div>
        
        <div className="mx-auto w-24 h-24 bg-purple-50 text-[#522874] rounded-full flex items-center justify-center mb-6 shadow-inner">
          <MapPinOff className="w-12 h-12" />
        </div>

        <h1 className="text-8xl md:text-9xl font-black text-gray-200 tracking-tighter mb-2 select-none">
          404
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-500 text-lg max-w-md mx-auto mb-10 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 font-bold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all active:scale-95 w-full sm:w-auto cursor-pointer"
          >
            <ArrowLeft size={18} /> Go Back
          </button>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-[#522874] text-white font-bold px-6 py-3.5 rounded-xl hover:bg-[#3d1d56] shadow-md transition-all active:scale-95 w-full sm:w-auto"
          >
            <LayoutDashboard size={18} /> Return to Dashboard
          </Link>
        </div>
      </div>
     
      
    </div>
  );
}
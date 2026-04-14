import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  PackageSearch,
  Receipt,
  UsersRound,
  LineChart,
  Truck,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION (Premium Dark Theme) */}
      <section className="relative bg-gradient-to-b from-[#1a0a2e] via-[#2a1040] to-[#3d1d56] pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-purple-200 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
            <ShieldCheck size={16} className="text-green-400" />
            Authorized Apollo Tyres Distributor
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200 mb-6 tracking-tight leading-tight">
            The Smart Hub for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Unnati Traders
            </span>
          </h1>

          <p className="text-lg md:text-xl text-purple-200/80 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Seamlessly manage wholesale inventory, automate GST billing, and
            track dealer Khatas in real-time across the Bhind district.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#522874] hover:bg-gray-100 rounded-xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Access ERP Portal <ArrowRight size={20} />
            </Link>
            <Link
              href="/tyres"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/20 hover:bg-white/20 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center backdrop-blur-sm"
            >
              View Catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* 2. TRUST / STATS BANNER */}
      <section className="bg-white border-b border-gray-200 py-8 relative z-20 -mt-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span className="font-bold text-gray-700">
                100% Genuine Products
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-[#522874]" />
              <span className="font-bold text-gray-700">
                Fast Regional Delivery
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-gray-700">
                Official Warranty Support
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES GRID (Bento Box Style) */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Enterprise-Grade Operations
            </h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">
              Built from the ground up to handle the heavy lifting of modern
              tyre distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="w-7 h-7 text-[#522874]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Smart POS Billing
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Generate professional PDF invoices instantly. Features inclusive
                GST calculations and automated tax breakdowns for B2B and B2C
                sales.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UsersRound className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Digital Khata (Ledger)
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Say goodbye to paper ledgers. Track dealer dues, log partial
                Udhaar payments, and archive settled accounts with zero
                friction.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PackageSearch className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Live Inventory Hub
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Monitor physical stock across multiple warehouses in real-time.
                Automated inwarding ensures your catalogue is always 100%
                accurate.
              </p>
            </div>

            {/* Feature 4 (Spans 2 columns on tablet/desktop) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group md:col-span-2 lg:col-span-2 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <LineChart className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Live Analytics & CA Reports
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Make data-driven decisions with real-time revenue vs. purchase
                  charts. Export perfectly formatted Excel sheets directly to
                  your Chartered Accountant with one click.
                </p>
              </div>
              <div className="flex-1 w-full bg-gray-50 rounded-2xl border border-gray-100 p-6 flex items-center justify-center">
                {/* Decorative mock-chart element */}
                <div className="w-full space-y-3">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#522874] w-[75%]" />
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 w-[45%]" />
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 w-[85%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#3d1d56] p-8 rounded-3xl shadow-lg border border-[#522874] hover:shadow-xl transition-shadow flex flex-col justify-center text-center">
              <Image
                src="https://res.cloudinary.com/dejsybv2l/image/upload/v1747323822/image-removebg-preview_1_k2j2o5.png"
                alt="Unnati Traders Logo"
                width={150}
                height={50}
                className="mx-auto mb-6 opacity-90 drop-shadow-md"
              />
              <h3 className="text-xl font-bold text-white mb-2">
                Ready to streamline?
              </h3>
              <p className="text-purple-200 text-sm mb-6">
                Staff and administrators can log in here.
              </p>
              <Link
                href="/sign-in"
                className="inline-block w-full py-3 bg-white text-[#522874] font-bold rounded-xl active:scale-95 transition-transform"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

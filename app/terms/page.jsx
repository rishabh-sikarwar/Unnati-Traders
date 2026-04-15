import { ScrollText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Dark Header */}
      <div className="bg-[#1a0a2e] pt-32 pb-32 px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 text-blue-400 mb-6 shadow-inner border border-blue-500/20">
          <ScrollText className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-purple-200 text-lg font-medium">
          Rules and guidelines for our distributors and buyers.
        </p>
      </div>

      {/* Floating Content Document */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 -mt-20">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 prose prose-purple max-w-none text-gray-600">
          <p className="font-bold text-gray-900 mb-8 text-sm uppercase tracking-widest">
            Last Updated: April 2026
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            1. General Agreement
          </h2>
          <p className="leading-relaxed mb-4">
            By purchasing from Unnati Traders or accessing our digital portal,
            you agree to these Terms of Service. Unnati Traders operates as an
            Authorized Distributor for Apollo Tyres in the Bhind district.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            2. Pricing and Billing
          </h2>
          <p className="leading-relaxed mb-4">
            All prices listed on invoices are inclusive of applicable GST unless
            explicitly stated otherwise. Wholesale discounts and dealer pricing
            are subject to approval and may be modified at the discretion of the
            management.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            3. Khata (Store Credit) Terms
          </h2>
          <p className="leading-relaxed mb-4">
            Sub-dealers approved for Udhaar (Store Credit) must clear their
            outstanding dues within the mutually agreed timeframe. Unnati
            Traders reserves the right to suspend further inventory dispatch to
            accounts with overdue balances.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            4. Returns and Warranties
          </h2>
          <p className="leading-relaxed mb-4">
            We honor all official Apollo Tyres manufacturing warranties.
            Defective items must be returned to our warehouse with the original
            tax invoice. Physical damage, improper installation, or misuse is
            not covered under warranty claims.
          </p>

          <hr className="my-10 border-gray-100" />

          <p className="text-sm text-gray-400 font-medium text-center">
            Unnati Traders Ltd. reserves the right to update these terms at any
            time without prior notice.
          </p>
        </div>
      </div>
    </div>
  );
}

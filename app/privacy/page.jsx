import { ShieldAlert } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Dark Header */}
      <div className="bg-[#1a0a2e] pt-32 pb-32 px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/50 text-purple-300 mb-6 shadow-inner border border-purple-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-purple-200 text-lg font-medium">
          How we handle and protect your data.
        </p>
      </div>

      {/* Floating Content Document */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 -mt-20">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 prose prose-purple max-w-none text-gray-600">
          <p className="font-bold text-gray-900 mb-8 text-sm uppercase tracking-widest">
            Last Updated: April 2026
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            1. Information We Collect
          </h2>
          <p className="leading-relaxed mb-4">
            Unnati Traders collects information necessary to provide our B2B and
            B2C services. This includes your name, contact number, business
            address, GST details (for dealers), and transaction history recorded
            within our ERP software.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            2. How We Use Your Data
          </h2>
          <p className="leading-relaxed mb-4">
            Your data is strictly used for processing transactions, managing
            inventory, maintaining the Khata (ledger) system, and facilitating
            Apollo tyre warranty claims. We do not sell or share your business
            data with unauthorized third parties.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            3. Data Security
          </h2>
          <p className="leading-relaxed mb-4">
            We employ industry-standard security measures, including secure
            authentication and encrypted database hosting, to protect your
            personal and financial information against unauthorized access or
            disclosure.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            4. Communication
          </h2>
          <p className="leading-relaxed mb-4">
            By registering as a dealer, you consent to receive transactional
            notifications, invoice summaries, and important stock updates via
            email or SMS.
          </p>

          <hr className="my-10 border-gray-100" />

          <p className="text-sm text-gray-400 font-medium text-center">
            If you have questions about our privacy practices, please reach out
            via the Contact Us page.
          </p>
        </div>
      </div>
    </div>
  );
}

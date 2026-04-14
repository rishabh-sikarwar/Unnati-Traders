"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "How do I claim a warranty for a defective Apollo tyre?",
      a: "If you purchased the tyre from us, simply bring the tyre along with your original Unnati Traders tax invoice to any of our shops. Our technical team will inspect the tyre and process the claim directly with Apollo.",
    },
    {
      q: "Can I become a sub-dealer in the Bhind district?",
      a: "Yes! We are always looking to expand our B2B network. Please use the Contact Us page to send your details, and our sales team will reach out to discuss credit limits, Khata setup, and bulk pricing.",
    },
    {
      q: "What payment methods do you accept?",
      a: "For retail walk-ins, we accept Cash, UPI, and Debit/Credit cards. For registered dealers, we offer an Udhaar (Store Credit) system managed through our digital Khata ledger.",
    },
    {
      q: "Do you deliver stock to dealer shops?",
      a: "Yes, we provide fast regional delivery for bulk wholesale orders across the district. Delivery terms can be discussed upon dealer registration.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-16 pt-28 md:pt-32">
      <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-inner">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Support & FAQs
          </h1>
          <p className="text-gray-500 text-lg">
            Everything you need to know about warranties, billing, and dealer
            accounts.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? "border-[#522874] shadow-md" : "border-gray-200 shadow-sm"}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none cursor-pointer"
              >
                <span
                  className={`font-bold text-lg ${openIndex === index ? "text-[#522874]" : "text-gray-800"}`}
                >
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? "rotate-180 text-[#522874]" : "text-gray-400"}`}
                />
              </button>

              <div
                className={`px-6 overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-40 pb-6 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

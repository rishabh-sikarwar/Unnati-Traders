import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#1a0a2e] text-purple-200/60 py-8 md:py-12 mt-auto border-t border-purple-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center md:items-start gap-8 text-center md:text-left">
        {/* Brand & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 text-white font-black tracking-widest text-lg uppercase">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            Unnati Traders
          </div>
          <div className="text-sm font-medium mt-1">
            © {currentYear} Unnati Traders Ltd. All Rights Reserved.
          </div>
          <div className="text-xs text-purple-400/50 font-bold uppercase tracking-wider mt-1">
            Authorized Apollo Distributor • Bhind
          </div>
        </div>

        {/* Legal & Support Links */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-sm font-medium">
          <Link
            href="/tyres"
            className="hover:text-white transition-colors duration-300"
          >
            Catalogue
          </Link>
          <Link
            href="/privacy"
            className="hover:text-white transition-colors duration-300"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-white transition-colors duration-300"
          >
            Terms of Service
          </Link>
          <Link
            href="/support"
            className="hover:text-white transition-colors duration-300"
          >
            Help Center
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

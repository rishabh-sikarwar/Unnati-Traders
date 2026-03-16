import React from "react";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#3d1d56] text-white/80 py-6 mt-auto border-t border-[#2a113d]">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm font-medium tracking-wide">
          © {currentYear}{" "}
          <span className="font-bold text-white">UNNATI TRADERS LTD</span>. All
          Rights Reserved.
        </div>

        <div className="flex items-center gap-6 text-sm text-white/60">
          <Link
            href="/privacy"
            className="hover:text-white transition-colors duration-300 cursor-pointer"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-white transition-colors duration-300 cursor-pointer"
          >
            Terms of Service
          </Link>
          <Link
            href="/support"
            className="hover:text-white transition-colors duration-300 cursor-pointer"
          >
            Help Center
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

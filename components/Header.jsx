"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ContactRound,
  LayoutDashboard,
  PhoneCallIcon,
  Users2Icon,
  MenuIcon,
  Receipt,
  PackageSearch,
  ShoppingCartIcon,
  ScrollText,
  UsersRound,
  X,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

const Header = () => {
  const { user } = useUser();
  const pathname = usePathname();
  const [dbRole, setDbRole] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef(null);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Track scroll for enhanced blur
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close drawer on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [mobileOpen]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const fetchUserRole = async (retries = 3) => {
      if (user) {
        try {
          const res = await fetch("/api/user/me");
          if (res.ok) {
            const data = await res.json();
            setDbRole(data.role);
          } else if (res.status === 404 && retries > 0) {
            setTimeout(() => fetchUserRole(retries - 1), 1000);
          }
        } catch (error) {
          console.error("Failed to fetch user role from database", error);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  const isInternalUser = dbRole === "ADMIN" || dbRole === "SHOPKEEPER";

  const publicLinks = [
    { name: "Tyres", icon: LayoutDashboard, href: "/tyres" },
    { name: "About Us", icon: Users2Icon, href: "/about-us" },
    { name: "Contact Us", icon: PhoneCallIcon, href: "/contact-us" },
    { name: "Support", icon: ContactRound, href: "/support" },
  ];

  const adminLinks = [
    { name: "Billing", icon: Receipt, href: "/billing", color: "text-green-300" },
    { name: "Khata", icon: UsersRound, href: "/customers", color: "text-blue-300" },
    { name: "Orders", icon: ScrollText, href: "/orders", color: "text-yellow-300" },
    { name: "Stock", icon: PackageSearch, href: "/stock", color: "text-purple-300" },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#3d1d56]/98 shadow-[0_4px_30px_rgba(0,0,0,0.35)]"
            : "bg-[#522874]/95"
        } backdrop-blur-xl border-b border-white/10`}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-[70px]">

            {/* ── LOGO ── */}
            <Link
              href={isInternalUser ? "/dashboard" : "/"}
              className="shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              <Image
                src="https://res.cloudinary.com/dejsybv2l/image/upload/v1747323822/image-removebg-preview_1_k2j2o5.png"
                alt="Unnati Traders"
                className="h-12 md:h-14 w-auto object-contain drop-shadow"
                height={56}
                width={180}
                priority
              />
            </Link>

            {/* ── CENTER: Public Nav ── */}
            <nav className={`hidden ${isInternalUser ? "xl:flex" : "lg:flex"} items-center gap-1`}>
              {publicLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-white text-[#522874] shadow-sm"
                      : "text-white/85 hover:text-white hover:bg-white/15"
                  }`}
                >
                  <item.icon size={15} />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* ── RIGHT: Admin ERP Pill + User Controls ── */}
            <div className="flex items-center gap-2 sm:gap-3">

              <SignedIn>
                {isInternalUser && (
                  <nav className="hidden lg:flex items-center gap-0.5 bg-black/25 backdrop-blur-sm px-1.5 py-1.5 rounded-xl border border-white/10 shadow-inner">
                    {adminLinks.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                          isActive(item.href)
                            ? "bg-white/20 text-white shadow-sm border border-white/15"
                            : "text-white/80 hover:text-white hover:bg-white/15"
                        }`}
                      >
                        <item.icon size={14} className={`${item.color} opacity-90`} />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                )}

                {!isInternalUser && (
                  <Link
                    href="/cart"
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white/85 hover:text-white hover:bg-white/15 transition-all duration-200"
                  >
                    <ShoppingCartIcon size={18} />
                    <span>Cart</span>
                  </Link>
                )}

                {/* User Avatar */}
                <div className="flex items-center justify-center rounded-full border-2 border-transparent hover:border-white/30 transition-all duration-300 shrink-0 ml-1">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: "w-9 h-9" } }}
                  />
                </div>
              </SignedIn>

              <SignedOut>
                {/* FIX APPLIED HERE: Added signUpForceRedirectUrl */}
                <SignInButton
                  forceRedirectUrl="/api/auth/sync"
                  signUpForceRedirectUrl="/api/auth/sync"
                >
                  <button className="hidden sm:flex items-center gap-2 bg-white text-[#522874] hover:bg-gray-50 font-bold px-4 py-2 rounded-lg text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer"
              >
                <MenuIcon size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR: Admin ERP nav for medium screens ── */}
        <SignedIn>
          {isInternalUser && (
            <div className="hidden md:flex lg:hidden border-t border-white/10 bg-black/20 backdrop-blur-sm">
              <div className="max-w-screen-xl mx-auto px-4 flex items-center gap-1 py-1.5 w-full overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-2 shrink-0 flex items-center gap-1">
                  <LayoutGrid size={10} /> Nav
                </span>
                {adminLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-white/20 text-white border border-white/15"
                        : "text-white/75 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    <item.icon size={13} className={item.color} />
                    {item.name}
                  </Link>
                ))}
                <div className="h-4 w-px bg-white/20 mx-2 shrink-0" />
                {publicLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-white/20 text-white"
                        : "text-white/55 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </SignedIn>
      </header>

      {/* ─────────────────────────── MOBILE DRAWER ─────────────────────────── */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[300px] sm:w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#522874] shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src="https://res.cloudinary.com/dejsybv2l/image/upload/v1747323822/image-removebg-preview_1_k2j2o5.png"
              alt="Unnati Traders"
              className="h-9 w-auto object-contain"
              height={36}
              width={120}
            />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <SignedOut>
            <div className="px-2 mb-4">
              {/* FIX APPLIED HERE TOO: Added signUpForceRedirectUrl */}
              <SignInButton
                forceRedirectUrl="/api/auth/sync"
                signUpForceRedirectUrl="/api/auth/sync"
              >
                <button className="w-full flex items-center justify-center gap-2 bg-[#522874] text-white font-bold px-4 py-3 rounded-xl text-sm shadow-md hover:bg-[#3d1d56] transition-colors cursor-pointer">
                  Sign In to Your Account
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            {isInternalUser && (
              <section className="mb-5">
                <div className="flex items-center gap-2 px-3 mb-2">
                  <LayoutGrid size={12} className="text-[#522874]" />
                  <span className="text-[10px] font-bold text-[#522874] uppercase tracking-widest">
                    Admin Controls
                  </span>
                </div>
                <div className="bg-[#522874]/5 rounded-xl p-1.5 border border-[#522874]/10 space-y-0.5">
                  {adminLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg font-bold text-sm transition-all duration-200 group ${
                        isActive(item.href)
                          ? "bg-[#522874] text-white shadow-sm"
                          : "text-gray-700 hover:bg-[#522874]/10 hover:text-[#522874]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${isActive(item.href) ? "bg-white/15" : "bg-[#522874]/10"}`}>
                          <item.icon size={15} className={isActive(item.href) ? "text-white" : "text-[#522874]"} />
                        </div>
                        {item.name}
                      </div>
                      <ChevronRight size={14} className={`opacity-40 group-hover:opacity-80 transition-opacity ${isActive(item.href) ? "text-white" : ""}`} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </SignedIn>

          <section className="mb-5">
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Main Menu
              </span>
            </div>
            <div className="space-y-0.5">
              {publicLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-3 rounded-lg font-semibold text-sm transition-all duration-200 group ${
                    isActive(item.href)
                      ? "bg-purple-50 text-[#522874]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className={isActive(item.href) ? "text-[#522874]" : "text-gray-400"} />
                    {item.name}
                  </div>
                  <ChevronRight size={14} className="opacity-30 group-hover:opacity-60 transition-opacity" />
                </Link>
              ))}
            </div>
          </section>

          <SignedIn>
            {!isInternalUser && (
              <section className="mb-5">
                <div className="space-y-0.5">
                  <Link
                    href="/cart"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 rounded-lg font-semibold text-sm transition-all duration-200 group ${
                      isActive("/cart")
                        ? "bg-purple-50 text-[#522874]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCartIcon size={16} className={isActive("/cart") ? "text-[#522874]" : "text-gray-400"} />
                      Cart
                    </div>
                    <ChevronRight size={14} className="opacity-30 group-hover:opacity-60 transition-opacity" />
                  </Link>
                </div>
              </section>
            )}
          </SignedIn>
        </div>

        <SignedIn>
          <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: "w-10 h-10" } }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {user?.fullName || "My Account"}
                </p>
                {dbRole && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#522874]/10 text-[#522874]">
                    {dbRole}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SignedIn>
        <SignedOut>
          <div className="shrink-0 border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-400 text-center">
              Unnati Traders · Apollo Distributor
            </p>
          </div>
        </SignedOut>
      </div>
    </>
  );
};

export default Header;
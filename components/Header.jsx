"use client";

import React, { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
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
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const { user } = useUser();
  const [dbRole, setDbRole] = useState(null);

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

  // UPDATED ADMIN LINKS: Replaced Inventory with Customers, organized logically
  const adminLinks = [
    { name: "Billing", icon: Receipt, href: "/billing" },
    { name: "Customers", icon: UsersRound, href: "/customers" },
    { name: "Orders", icon: ScrollText, href: "/orders" },
    { name: "Stock", icon: PackageSearch, href: "/stock" },
  ];

  return (
    <div className="fixed top-0 w-full bg-[#522874]/95 backdrop-blur-lg z-50 border-b border-[#3d1d56] shadow-md transition-all">
      <nav className="container mx-auto px-4 py-3 relative flex items-center justify-between">
        {/* Logo - Left */}
        <Link
          href={isInternalUser ? "/dashboard" : "/"}
          className="cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 shrink-0"
        >
          <Image
            src="https://res.cloudinary.com/dejsybv2l/image/upload/v1747323822/image-removebg-preview_1_k2j2o5.png"
            alt="Logo"
            className="h-14 md:h-16 w-auto object-contain drop-shadow-sm"
            height={60}
            width={200}
            priority
          />
        </Link>

        {/* Center Nav Items (Always Visible on Extra Large Screens) */}
        <div className="hidden xl:flex gap-2 items-center absolute left-1/2 -translate-x-1/2 w-max">
          {publicLinks.map((item) => (
            <Button
              key={item.name}
              asChild
              variant="ghost"
              className="text-white/90 hover:text-[#522874] hover:bg-white cursor-pointer transition-all duration-300 hover:shadow-sm"
            >
              <Link href={item.href}>
                <item.icon size={18} className="mr-2" /> {item.name}
              </Link>
            </Button>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <SignedOut>
            <SignInButton forceRedirectUrl="/api/auth/sync">
              <Button className="bg-white text-[#522874] hover:bg-gray-50 font-bold cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-3">
              {/* Internal Nav for Admin/Employee (Hidden on Mobile) */}
              {isInternalUser && (
                <div className="hidden lg:flex gap-1 mr-2 bg-black/20 p-1.5 rounded-xl border border-white/10 shadow-inner">
                  {adminLinks.map((item) => (
                    <Button
                      key={item.name}
                      asChild
                      variant="ghost"
                      className="cursor-pointer font-bold text-white/90 hover:text-white hover:bg-white/20 transition-all duration-300 rounded-lg px-4"
                    >
                      <Link href={item.href}>
                        <item.icon size={16} className="mr-2 opacity-80" />{" "}
                        {item.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}

              {/* Cart button (Only for visitors/dealers) */}
              {!isInternalUser && (
                <Button
                  asChild
                  variant="ghost"
                  className="text-white hover:bg-white/20 cursor-pointer transition-all duration-300 hover:scale-105"
                >
                  <Link href={"/cart"}>
                    <ShoppingCartIcon size={20} />
                    <span className="hidden md:inline ml-2 font-medium">
                      Cart
                    </span>
                  </Link>
                </Button>
              )}

              {/* PERFECT CIRCLE User Avatar */}
              <div className="flex items-center justify-center rounded-full border-2 border-transparent hover:border-white/40 transition-all duration-300 shrink-0 cursor-pointer shadow-sm ml-2">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{ elements: { avatarBox: "w-9 h-9" } }}
                />
              </div>
            </div>
          </SignedIn>

          {/* MOBILE MENU (Handles BOTH Public and Admin Links) */}
          <div className="lg:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 cursor-pointer transition-colors duration-200"
                >
                  <MenuIcon size={26} />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-white border-l-0 shadow-2xl w-72 overflow-y-auto"
              >
                <div className="flex flex-col gap-2 mt-8">
                  {/* Public Links */}
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-3 mt-4">
                    Main Menu
                  </div>
                  {publicLinks.map((item) => (
                    <Button
                      key={item.name}
                      asChild
                      variant="ghost"
                      className="w-full justify-start cursor-pointer hover:bg-purple-50 hover:text-[#522874] transition-colors"
                    >
                      <Link href={item.href}>
                        <item.icon size={18} className="mr-3 text-gray-500" />{" "}
                        {item.name}
                      </Link>
                    </Button>
                  ))}

                  {/* Admin Links */}
                  {isInternalUser && (
                    <>
                      <div className="h-px bg-gray-100 my-3 w-full" />
                      <div className="text-xs font-bold text-[#522874] uppercase tracking-wider mb-1 px-3">
                        Admin Controls
                      </div>
                      {adminLinks.map((item) => (
                        <Button
                          key={item.name}
                          asChild
                          variant="ghost"
                          className="w-full justify-start cursor-pointer hover:bg-purple-50 hover:text-[#522874] transition-colors"
                        >
                          <Link href={item.href}>
                            <item.icon
                              size={18}
                              className="mr-3 text-[#522874]/60"
                            />{" "}
                            {item.name}
                          </Link>
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;

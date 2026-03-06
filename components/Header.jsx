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
  ShoppingCartIcon,
  Users2Icon,
  MenuIcon,
  Receipt,
  PackageSearch,
  Truck,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const { user, isLoaded } = useUser();
  const [dbRole, setDbRole] = useState(null);

  // Fetch the role from our custom API when the user loads
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const res = await fetch("/api/user/me");
          if (res.ok) {
            const data = await res.json();
            setDbRole(data.role); // Store the Prisma Enum ('ADMIN', 'VISITOR', etc.)
          }
        } catch (error) {
          console.error("Failed to fetch user role from database", error);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  // Determine permissions based on the database role
  const isInternalUser = dbRole === "ADMIN" || dbRole === "SHOPKEEPER";

  return (
    <div className="fixed top-0 w-full bg-[#522874]/90 backdrop-blur-md z-50 border-b border-[#3d1d56] shadow-sm">
      <nav className="container mx-auto px-4 py-3 relative flex items-center justify-between">
        {/* Logo - Left */}
        <Link
          href={"/"}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <Image
            src="https://res.cloudinary.com/dejsybv2l/image/upload/v1747323822/image-removebg-preview_1_k2j2o5.png"
            alt="Logo"
            className="h-16 w-auto object-contain"
            height={60}
            width={200}
            priority
          />
        </Link>

        {/* Center Nav Items (Large Screens Only) */}
        {!isInternalUser && (
          <div className="hidden md:flex gap-4 items-center absolute left-1/2 -translate-x-1/2">
            <Button
              asChild
              variant="ghost"
              className="text-white hover:text-[#522874] hover:bg-white cursor-pointer transition-all"
            >
              <Link href={"/tyres"}>
                <LayoutDashboard size={18} className="mr-2" /> Tyres
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              className="text-white hover:text-[#522874] hover:bg-white cursor-pointer transition-all"
            >
              <Link href={"/about-us"}>
                <Users2Icon size={18} className="mr-2" /> About Us
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              className="text-white hover:text-[#522874] hover:bg-white cursor-pointer transition-all"
            >
              <Link href={"/contact-us"}>
                <PhoneCallIcon size={18} className="mr-2" /> Contact Us
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              className="text-white hover:text-[#522874] hover:bg-white cursor-pointer transition-all"
            >
              <Link href={"/support"}>
                <ContactRound size={18} className="mr-2" /> Support
              </Link>
            </Button>
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton forceRedirectUrl="/api/auth/sync">
              <Button className="bg-white text-[#522874] hover:bg-gray-100 font-semibold cursor-pointer shadow-md transition-all hover:scale-105">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {/* Mobile Menu for Visitors */}
            {!isInternalUser && (
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white cursor-pointer"
                    >
                      <MenuIcon size={24} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-white">
                    <div className="flex flex-col gap-4 mt-10">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start cursor-pointer"
                      >
                        <Link href={"/tyres"}>
                          <LayoutDashboard size={18} className="mr-3" /> Tyres
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start cursor-pointer"
                      >
                        <Link href={"/about-us"}>
                          <Users2Icon size={18} className="mr-3" /> About Us
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start cursor-pointer"
                      >
                        <Link href={"/contact-us"}>
                          <PhoneCallIcon size={18} className="mr-3" /> Contact
                          Us
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start cursor-pointer"
                      >
                        <Link href={"/support"}>
                          <ContactRound size={18} className="mr-3" /> Support
                        </Link>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Internal Nav for Admin/Employee */}
              {isInternalUser && (
                <div className="hidden md:flex gap-2 mr-4">
                  <Button
                    asChild
                    variant="secondary"
                    className="cursor-pointer font-medium"
                  >
                    <Link href={"/billing"}>
                      <Receipt size={16} className="mr-2" /> Billing
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="cursor-pointer font-medium"
                  >
                    <Link href={"/stock"}>
                      <PackageSearch size={16} className="mr-2" /> Stock
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="cursor-pointer font-medium"
                  >
                    <Link href={"/orders"}>
                      <Truck size={16} className="mr-2" /> Orders
                    </Link>
                  </Button>
                </div>
              )}

              {/* Cart button (Only for visitors/dealers) */}
              {!isInternalUser && (
                <Button
                  asChild
                  variant="ghost"
                  className="text-white hover:bg-white/20 cursor-pointer"
                >
                  <Link href={"/cart"}>
                    <ShoppingCartIcon size={20} />
                    <span className="hidden md:inline ml-2">Cart</span>
                  </Link>
                </Button>
              )}

              <div className="cursor-pointer hover:ring-2 hover:ring-white rounded-full transition-all">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </SignedIn>
        </div>
      </nav>
    </div>
  );
};

export default Header;

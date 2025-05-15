"use client";

import React from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
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
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUser } from "@clerk/nextjs";

const Header = () => {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const isInternalUser = role === "admin" || role === "employee";

  return (
    <div className="fixed top-0 w-full bg-[#522874]/80 backdrop-blur-xs z-50 border-b px-4 pr-7">
      <nav className="container mx-auto px-4 py-4 relative flex items-center justify-between">
        {/* Logo - Left */}
        <Link href={"/"}>
          <Image
            src="https://res.cloudinary.com/dejsybv2l/image/upload/v1747323822/image-removebg-preview_1_k2j2o5.png"
            alt="Logo"
            className="h-20 w-auto object-contain"
            height={60}
            width={200}
          />
        </Link>

        {/* Center Nav Items (Large Screens Only) */}
        {!isInternalUser && (
          <div className="hidden md:flex gap-2 items-center absolute left-1/2 -translate-x-1/2">
            <Link href={"/tyres"}>
              <Button variant="outline">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Tyres</span>
              </Button>
            </Link>
            <Link href={"/about-us"}>
              <Button variant="outline">
                <Users2Icon size={18} />
                <span className="hidden md:inline">About Us</span>
              </Button>
            </Link>
            <Link href={"/contact-us"}>
              <Button variant="outline">
                <PhoneCallIcon size={18} />
                <span className="hidden md:inline">Contact Us</span>
              </Button>
            </Link>
            <Link href={"/support"}>
              <Button variant="outline">
                <ContactRound size={18} />
                <span className="hidden md:inline">Support</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline" className="cursor-pointer">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {/* Mobile Menu */}
            {!isInternalUser && (
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger>
                    <MenuIcon className="cursor-pointer" />
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-white">
                    <div className="flex flex-col overflow-y-auto gap-4 mt-10">
                      <Link href={"/tyres"}>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <LayoutDashboard size={18} />
                          <span className="ml-2">Tyres</span>
                        </Button>
                      </Link>
                      <Link href={"/about-us"}>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Users2Icon size={18} />
                          <span className="ml-2">About Us</span>
                        </Button>
                      </Link>
                      <Link href={"/contact-us"}>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <PhoneCallIcon size={18} />
                          <span className="ml-2">Contact Us</span>
                        </Button>
                      </Link>
                      <Link href={"/support"}>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <ContactRound size={18} />
                          <span className="ml-2">Support</span>
                        </Button>
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            {/* Cart and User Button */}
            <div className="flex items-center gap-2">
              {!isInternalUser && (
                <Link href={"/cart"}>
                  <Button variant="ghost">
                    <ShoppingCartIcon size={18} />
                    <span className="hidden md:inline">Cart</span>
                  </Button>
                </Link>
              )}
              <UserButton />
            </div>

            {/* Internal Nav for Admin/Employee */}
            {isInternalUser && (
              <div className="flex gap-2">
                <Link href={"/billing"}>
                  <Button variant="outline">Billing</Button>
                </Link>
                <Link href={"/stock"}>
                  <Button variant="outline">Stock</Button>
                </Link>
                <Link href={"/orders"}>
                  <Button variant="outline">Orders</Button>
                </Link>
              </div>
            )}
          </SignedIn>
        </div>
      </nav>
    </div>
  );
};

export default Header;

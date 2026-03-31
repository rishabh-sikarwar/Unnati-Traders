import Header from "../components/Header";
import Footer from "../components/Footer";
import "./globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Unnati Traders",
  description: "Bhind District Apollo Authorized Distributor",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
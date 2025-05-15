import Header from "@/components/Header";
import "./globals.css";
import {Inter} from "next/font/google"
import Footer from "@/components/Footer";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const inter = Inter({subsets: ['latin']})

export const metadata = {
  title: "Unnati Traders",
  description: "Bhind District Apollo Authorized Distributor",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          <Header />
          <main className="min-h-screen"
          >{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}

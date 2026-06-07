"use client";
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingEmergencyButton from "@/components/ui/FloatingEmergencyButton";
import { usePathname } from "next/navigation";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Pages that use full-screen layouts and don't need footer
const FULLSCREEN_PAGES = ["/map"];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_PAGES.includes(pathname);

  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <main className="flex-1 pt-14">{children}</main>
        {!isFullscreen && <Footer />}
        <FloatingEmergencyButton />
      </body>
    </html>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/components/ui/NotificationBell";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/map", label: "Peta" },
  { href: "/report", label: "Laporan" },
  { href: "/status", label: "Status Jalan" },
  { href: "/education", label: "Edukasi" },
  { href: "/news", label: "Berita" },
  { href: "/emergency", label: "Darurat" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      {/* Modern Minimalist Navbar - Thin, Glassmorphic, High Contrast */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand - Refined Typography */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <Shield className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-base tracking-tight text-white">SIRAT</span>
          </Link>

          {/* Desktop Navigation - Minimal Spacing */}
          <ul className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    pathname === l.href
                      ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Actions - Integrated & Clean */}
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            {!isDashboard && (
              <Link
                href="/dashboard"
                className="hidden md:flex items-center text-[13px] font-medium bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              >
                Dashboard
              </Link>
            )}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer - Glassmorphic Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-80 bg-slate-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-semibold text-white tracking-tight">Menu</span>
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
              <ul className="space-y-1">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        pathname === l.href
                          ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
                {!isDashboard && (
                  <li className="pt-2 mt-2 border-t border-white/5">
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all duration-200"
                    >
                      Dashboard
                    </Link>
                  </li>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

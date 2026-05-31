"use client";
import { Phone } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function FloatingEmergencyButton() {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
    >
      <Link href="/emergency">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-2.5 bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-2xl shadow-rose-500/40 hover:shadow-rose-500/60 transition-all duration-300 overflow-hidden"
        >
          {/* Animated background pulse */}
          <span className="absolute inset-0 bg-gradient-to-br from-rose-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Pulsing ring effect */}
          <span className="absolute inset-0 rounded-2xl">
            <span className="absolute inset-0 rounded-2xl bg-rose-500 animate-ping opacity-20" />
          </span>
          
          {/* Icon with animation */}
          <div className="relative p-1 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
            <Phone size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-300" />
          </div>
          
          {/* Text */}
          <span className="relative text-sm font-semibold tracking-tight">Darurat</span>
          
          {/* Shine effect on hover */}
          <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
        </motion.button>
      </Link>
    </motion.div>
  );
}

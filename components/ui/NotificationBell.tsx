"use client";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, markAllRead } = useAppStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Minimalist Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative p-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all duration-200 group"
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-br from-rose-500 to-rose-600 rounded-full text-[10px] flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/30 animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Glassmorphic Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold text-white tracking-tight">Notifikasi</span>
              {unread > 0 && (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {unread} baru
                </span>
              )}
            </div>

            {/* Notification List */}
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-slate-600 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-slate-400">Tidak ada notifikasi</p>
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <li 
                    key={n.id} 
                    className="px-4 py-3.5 text-[13px] text-slate-300 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>
                      <p className="leading-relaxed">{n.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { Shield } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950/50 backdrop-blur-xl border-t border-white/5 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 text-sm">
        {/* Brand Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <Shield size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-white tracking-tight">S-Rotem</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[13px]">
            Platform Keselamatan Jalan Pintar — memantau, melaporkan, dan merespons kondisi lalu lintas secara real-time.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-white font-semibold mb-4 text-sm tracking-tight">Tautan Cepat</p>
          <ul className="space-y-2">
            {[
              ["Peta Monitoring", "/map"],
              ["Laporan Insiden", "/report"],
              ["Status Jalan", "/status"],
              ["Edukasi", "/education"]
            ].map(([label, href]) => (
              <li key={href}>
                <Link 
                  href={href} 
                  className="text-slate-400 hover:text-emerald-400 transition-colors text-[13px] inline-flex items-center group"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-emerald-400 mr-2 transition-colors"></span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Emergency Contacts */}
        <div>
          <p className="text-white font-semibold mb-4 text-sm tracking-tight">Kontak Darurat</p>
          <ul className="space-y-2.5">
            {[
              ["Polisi", "110"],
              ["Ambulans", "118"],
              ["Pemadam", "113"],
              ["Jasa Marga", "14080"]
            ].map(([service, number]) => (
              <li key={service} className="flex items-center justify-between text-[13px]">
                <span className="text-slate-400">{service}:</span>
                <span className="font-semibold text-white bg-white/5 px-3 py-1 rounded-lg">{number}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 mt-10 pt-8 border-t border-white/5 text-center">
        <p className="text-xs text-slate-500 tracking-wide">
          © {new Date().getFullYear()} S-Rotem — Sistem Monitoring Keselamatan Jalan
        </p>
      </div>
    </footer>
  );
}

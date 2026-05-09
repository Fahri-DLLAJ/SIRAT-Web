"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Map,
  Activity,
  Cpu,
  CheckCircle,
  BookOpen,
  Newspaper,
  Phone,
  ChevronRight,
  Shield,
  Zap,
  Eye,
  TriangleAlert,
  Waves,
  Construction,
} from "lucide-react";
import StatCard from "@/components/cards/StatCard";
import { useReports } from "@/hooks/useReports";
import { useDevices } from "@/hooks/useDevices";

const MapPreview = dynamic(() => import("@/components/map/MapPreview"), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const EDUCATION_ITEMS = [
  { icon: Shield, title: "Jarak Aman Berkendara", desc: "Jaga jarak minimal 3 detik dari kendaraan di depan untuk reaksi yang cukup.", color: "text-blue-400" },
  { icon: Eye, title: "Titik Buta Kendaraan", desc: "Kenali area blind spot truk dan bus agar terhindar dari kecelakaan.", color: "text-purple-400" },
  { icon: Zap, title: "Bahaya Aquaplaning", desc: "Kurangi kecepatan saat hujan untuk mencegah kehilangan kendali di jalan basah.", color: "text-yellow-400" },
  { icon: Activity, title: "Mengemudi Defensif", desc: "Antisipasi perilaku pengemudi lain dan selalu siap menghadapi situasi darurat.", color: "text-green-400" },
];

const NEWS_ITEMS = [
  { tag: "Kecelakaan", time: "2 jam lalu", title: "Tabrakan Beruntun di Tol Jagorawi KM 12", desc: "Tiga kendaraan terlibat, arus lalu lintas dialihkan sementara.", icon: TriangleAlert, color: "text-red-400 bg-red-400/10" },
  { tag: "Banjir", time: "4 jam lalu", title: "Genangan Air di Jl. Casablanca Arah Kuningan", desc: "Ketinggian air mencapai 25cm, kendaraan rendah diminta memutar.", icon: Waves, color: "text-blue-400 bg-blue-400/10" },
  { tag: "Perbaikan", time: "1 hari lalu", title: "Perbaikan Jalan Jl. Gatot Subroto Selesai", desc: "Pengerjaan aspal selesai, lalu lintas kembali normal dua arah.", icon: Construction, color: "text-yellow-400 bg-yellow-400/10" },
];

const EMERGENCY_STEPS = [
  { step: "01", title: "Amankan Lokasi", desc: "Nyalakan lampu hazard dan pasang segitiga pengaman 50m di belakang kendaraan." },
  { step: "02", title: "Hubungi Bantuan", desc: "Segera hubungi 110 (Polisi), 118 (Ambulans), atau 113 (Pemadam Kebakaran)." },
  { step: "03", title: "Laporkan via S-Rotem", desc: "Gunakan fitur Laporan Insiden untuk mengirim lokasi dan foto kejadian secara real-time." },
  { step: "04", title: "Bantu Korban", desc: "Jika aman, berikan pertolongan pertama sambil menunggu petugas tiba di lokasi." },
];

export default function HomePage() {
  const { todayCount, resolvedCount } = useReports();
  const { activeCount } = useDevices();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-950 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.15)_0%,_transparent_60%)]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "60px 60px" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Platform{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Keselamatan Jalan
              </span>{" "}
              Pintar
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-gray-400 text-lg mb-8 max-w-lg leading-relaxed"
            >
              S-Rotem mengintegrasikan kamera ESP32-CAM, sensor IoT, dan partisipasi masyarakat untuk memantau, melaporkan, dan merespons kondisi lalu lintas secara real-time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/report"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-900/30"
              >
                <AlertTriangle size={18} />
                Laporkan Insiden
              </Link>
              <Link
                href="/map"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-900/30"
              >
                <Map size={18} />
                Lihat Peta
              </Link>
              <Link
                href="/status"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
              >
                <Activity size={18} />
                Kondisi Jalan
              </Link>
            </motion.div>
          </div>

          {/* Hero Map Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden lg:block"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/20">
              <MapPreview
                center={[-7.7059, 110.6010]}
                zoom={12}
                heightPx={320}
                markers={[
                  { lat: -7.7059, lng: 110.6010, label: "Kecelakaan — Simpang Pedan" },
                  { lat: -7.7080, lng: 110.5980, label: "Banjir — Jl. Pemuda" },
                  { lat: -7.7350, lng: 110.5400, label: "Jalan Rusak — Klaten–Prambanan" },
                ]}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Statistics Summary ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold mb-2">Ringkasan Sistem</h2>
          <p className="text-gray-400 text-sm">Data real-time dari seluruh jaringan monitoring</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={AlertTriangle} label="Laporan Hari Ini" value={todayCount} sub="Insiden tercatat" color="text-red-400" delay={0} />
          <StatCard icon={Cpu} label="Perangkat Aktif" value={activeCount} sub="Kamera & sensor online" color="text-green-400" delay={0.1} />
          <StatCard icon={CheckCircle} label="Insiden Diselesaikan" value={resolvedCount} sub="Total tertangani" color="text-blue-400" delay={0.2} />
        </div>
      </section>

      {/* ── Safety Education Section ── */}
      <section className="bg-gray-900/50 border-y border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                <BookOpen size={16} />
                Edukasi Keselamatan
              </div>
              <h2 className="text-2xl font-bold">Tips Berkendara Aman</h2>
            </div>
            <Link href="/education" className="hidden sm:flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EDUCATION_ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors group cursor-pointer"
              >
                <div className={`p-2.5 rounded-xl bg-white/10 w-fit mb-4 ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} />
                </div>
                <h3 className="font-semibold mb-2 text-sm">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News / Traffic Information Section ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
              <Newspaper size={16} />
              Berita & Info Lalu Lintas
            </div>
            <h2 className="text-2xl font-bold">Update Terkini</h2>
          </div>
          <Link href="/news" className="hidden sm:flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Lihat Semua <ChevronRight size={16} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NEWS_ITEMS.map((item, i) => (
            <motion.article
              key={item.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${item.color}`}>
                  <item.icon size={12} />
                  {item.tag}
                </span>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
              <h3 className="font-semibold text-sm mb-2 group-hover:text-blue-400 transition-colors leading-snug">{item.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── Emergency Steps Section ── */}
      <section className="bg-gradient-to-br from-red-950/30 via-gray-950 to-gray-950 border-y border-red-900/20 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-medium mb-2">
              <Phone size={16} />
              Prosedur Darurat
            </div>
            <h2 className="text-2xl font-bold mb-2">Apa yang Harus Dilakukan Saat Darurat?</h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">Ikuti langkah-langkah berikut untuk memastikan keselamatan Anda dan orang lain di sekitar lokasi kejadian.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {EMERGENCY_STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="text-4xl font-black text-red-900/60 mb-3">{s.step}</div>
                <h3 className="font-semibold mb-2 text-sm">{s.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-red-950/40 border border-red-900/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-bold text-lg mb-1">Butuh Bantuan Segera?</h3>
              <p className="text-gray-400 text-sm">Hubungi nomor darurat atau gunakan tombol darurat di pojok kanan bawah layar.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a href="tel:110" className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
                <Phone size={16} /> 110 — Polisi
              </a>
              <Link href="/emergency" className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                Info Lengkap
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-extrabold mb-4">
            Bersama Kita Jaga{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Keselamatan Jalan
            </span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Setiap laporan yang Anda kirim membantu petugas merespons lebih cepat dan menyelamatkan lebih banyak nyawa.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/report" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-900/30">
              Mulai Melapor
            </Link>

          </div>
        </motion.div>
      </section>
    </div>
  );
}

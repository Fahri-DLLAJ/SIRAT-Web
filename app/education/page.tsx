"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  HardHat,
  Gauge,
  Moon,
  CloudRain,
  Image,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Phone,
  FileText,
  ShieldAlert,
  X,
} from "lucide-react";

// ── Safety Materials ──────────────────────────────────────────────
const CATEGORIES = [
  {
    icon: HardHat,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    title: "Helmets",
    titleId: "Helm",
    points: [
      "Selalu gunakan helm SNI yang tersertifikasi.",
      "Pastikan tali helm terpasang dengan benar dan tidak longgar.",
      "Ganti helm setiap 3–5 tahun atau setelah benturan keras.",
      "Pilih helm full-face untuk perlindungan maksimal di jalan raya.",
    ],
  },
  {
    icon: Gauge,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    title: "Safe Speed",
    titleId: "Kecepatan Aman",
    points: [
      "Batas kecepatan di kawasan ZoSS: 25 km/jam.",
      "Di jalan raya dalam kota: maksimal 50 km/jam.",
      "Di jalan tol: 60–100 km/jam sesuai rambu.",
      "Kurangi kecepatan 30% saat kondisi jalan basah.",
    ],
  },
  {
    icon: Moon,
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
    title: "Night Riding",
    titleId: "Berkendara Malam",
    points: [
      "Nyalakan lampu utama dan lampu belakang setiap saat.",
      "Gunakan rompi atau aksesori reflektif agar terlihat.",
      "Hindari menatap langsung lampu kendaraan dari arah berlawanan.",
      "Istirahat setiap 2 jam untuk mencegah microsleep.",
    ],
  },
  {
    icon: CloudRain,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/20",
    title: "Riding in the Rain",
    titleId: "Berkendara Hujan",
    points: [
      "Kurangi kecepatan dan perbesar jarak aman dengan kendaraan depan.",
      "Hindari pengereman mendadak untuk mencegah aquaplaning.",
      "Gunakan jas hujan dua bagian agar tidak mengganggu visibilitas.",
      "Waspada genangan air yang menyembunyikan lubang jalan.",
    ],
  },
];

// ── Daily Tips ────────────────────────────────────────────────────
const TIPS = [
  "Pelan-pelan di dekat sekolah.",
  "Selalu cek tekanan ban sebelum berkendara.",
  "Jangan gunakan ponsel saat mengemudi.",
  "Nyalakan lampu motor di siang hari.",
  "Beri prioritas kepada pejalan kaki di zebra cross.",
  "Istirahat setiap 2 jam dalam perjalanan jauh.",
  "Periksa rem kendaraan secara berkala.",
  "Gunakan jalur kiri untuk kendaraan lambat.",
];

// ── Emergency Steps ───────────────────────────────────────────────
const EMERGENCY_STEPS = [
  {
    icon: ShieldAlert,
    step: "01",
    title: "Amankan Lokasi",
    color: "text-red-400",
    desc: "Nyalakan lampu hazard segera. Pasang segitiga pengaman minimal 50m di belakang kendaraan. Jauhkan kendaraan dari jalur lalu lintas jika memungkinkan.",
  },
  {
    icon: Phone,
    step: "02",
    title: "Hubungi Bantuan",
    color: "text-orange-400",
    desc: "Hubungi 110 (Polisi), 118 (Ambulans), atau 113 (Pemadam Kebakaran). Sampaikan lokasi, jumlah korban, dan kondisi darurat dengan jelas.",
  },
  {
    icon: FileText,
    step: "03",
    title: "Kirim Laporan",
    color: "text-yellow-400",
    desc: "Gunakan fitur Laporan Insiden S-Rotem untuk mengirim lokasi GPS dan foto kejadian secara real-time kepada petugas terkait.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

// ── Dynamic types ─────────────────────────────────────────────────
interface Poster { id: string; title: string; tag: string; color: string; icon: string; imageUrl?: string | null; }
interface QuizItem { id: string; q: string; options: string[]; answer: number; explanation: string; }

// ── Component ─────────────────────────────────────────────────────
export default function EducationPage() {
  const [openCat, setOpenCat] = useState<number | null>(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizItem[]>([]);
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);

  useEffect(() => { setTipIndex(Math.floor(Math.random() * TIPS.length)); }, []);

  const loadContent = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/education");
      const data = await res.json();
      setPosters(data.posters ?? []);
      setQuizQuestions(data.quizzes ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);



  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = quizQuestions[quizIndex];
  const isCorrect = selected !== null && currentQ ? selected === currentQ.answer : false;

  function handleAnswer(i: number) {
    if (selected !== null || !currentQ) return;
    setSelected(i);
    if (i === currentQ.answer) setScore((s) => s + 1);
  }

  function nextQuestion() {
    if (quizIndex + 1 >= quizQuestions.length) {
      setQuizDone(true);
    } else {
      setQuizIndex((q) => q + 1);
      setSelected(null);
    }
  }

  function resetQuiz() {
    setQuizIndex(0);
    setSelected(null);
    setQuizDone(false);
    setScore(0);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Hero ── */}
      <section className="relative pt-24 pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-gray-950 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.12)_0%,_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-5"
          >
            <BookOpen size={14} />
            Edukasi Keselamatan Jalan
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            Materi{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Keselamatan
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-xl mx-auto"
          >
            Pelajari panduan berkendara aman, uji pengetahuan Anda, dan ketahui prosedur darurat yang tepat.
          </motion.p>
        </div>
      </section>

      {/* ── Safety Materials ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <SectionLabel icon={HardHat} color="text-yellow-400" label="Materi Keselamatan" />
        <h2 className="text-2xl font-bold mb-6">Kategori Panduan</h2>

        {/* Desktop: 4-col grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`border rounded-2xl p-5 ${cat.bg}`}
            >
              <div className={`p-2.5 rounded-xl bg-white/10 w-fit mb-4 ${cat.color}`}>
                <cat.icon size={20} />
              </div>
              <h3 className="font-bold mb-1">{cat.title}</h3>
              <p className={`text-xs font-medium mb-3 ${cat.color}`}>{cat.titleId}</p>
              <ul className="space-y-1.5">
                {cat.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle size={12} className={`mt-0.5 shrink-0 ${cat.color}`} />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Mobile: accordion */}
        <div className="md:hidden space-y-2">
          {CATEGORIES.map((cat, i) => (
            <div key={cat.title} className={`border rounded-2xl overflow-hidden ${cat.bg}`}>
              <button
                className="w-full flex items-center justify-between px-4 py-3.5"
                onClick={() => setOpenCat(openCat === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <cat.icon size={18} className={cat.color} />
                  <span className="font-semibold text-sm">{cat.title}</span>
                </div>
                {openCat === i ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              <AnimatePresence>
                {openCat === i && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden px-4 pb-4 space-y-2"
                  >
                    {cat.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-xs text-gray-300">
                        <CheckCircle size={12} className={`mt-0.5 shrink-0 ${cat.color}`} />
                        {p}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── Digital Posters ── */}
      <section className="bg-gray-900/50 border-y border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <SectionLabel icon={Image} color="text-purple-400" label="Poster Digital" />
          <h2 className="text-2xl font-bold mb-6">Galeri Poster</h2>
          {posters.length === 0 ? (
            <p className="text-gray-500 text-sm">Belum ada poster. Tambahkan melalui dashboard admin.</p>
          ) : (
            <div className="overflow-hidden">
              <div className="flex gap-3 w-max poster-track">
                {[...posters, ...posters].map((poster, i) => (
                  <div
                    key={`${poster.id}-${i}`}
                    onClick={() => setSelectedPoster(poster)}
                    className="relative flex-shrink-0 w-36 aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-white/10 bg-gray-800 hover:scale-105 transition-transform shadow-lg"
                  >
                    {poster.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster.imageUrl} alt={poster.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">{poster.icon}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <span className="text-[10px] font-medium bg-black/40 rounded-full px-2 py-0.5">{poster.tag}</span>
                      <p className="text-xs font-semibold mt-1 leading-snug">{poster.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Poster Lightbox ── */}
      <AnimatePresence>
        {selectedPoster && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedPoster(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-sm w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedPoster.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedPoster.imageUrl} alt={selectedPoster.title} className="w-full object-cover max-h-[70vh]" />
              ) : (
                <div className="flex items-center justify-center h-64 text-7xl bg-gray-800">{selectedPoster.icon}</div>
              )}
              <div className="p-4">
                <span className="text-xs font-semibold text-purple-400">{selectedPoster.tag}</span>
                <p className="font-bold text-white mt-1">{selectedPoster.title}</p>
              </div>
              <button
                onClick={() => setSelectedPoster(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Daily Tips ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <SectionLabel icon={Lightbulb} color="text-green-400" label="Tips Harian" />
        <h2 className="text-2xl font-bold mb-6">Tips Hari Ini</h2>
        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-green-950/40 to-gray-900 border border-green-500/20 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6 max-w-2xl"
        >
          <div className="p-4 rounded-2xl bg-green-400/10 border border-green-400/20 shrink-0">
            <Lightbulb size={32} className="text-green-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs text-green-400 font-medium mb-1">Tips Hari Ini</p>
            <p className="text-lg font-semibold">{TIPS[tipIndex]}</p>
          </div>
          <button
            onClick={() => setTipIndex((t) => (t + 1) % TIPS.length)}
            className="shrink-0 p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
            title="Tips berikutnya"
          >
            <RefreshCw size={18} className="text-gray-300" />
          </button>
        </motion.div>
      </section>

      {/* ── Mini Quiz ── */}
      <section className="bg-gray-900/50 border-y border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <SectionLabel icon={HelpCircle} color="text-blue-400" label="Mini Kuis" />
          <h2 className="text-2xl font-bold mb-6">Uji Pengetahuan Anda</h2>

          <div className="max-w-2xl">
            {quizQuestions.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada pertanyaan kuis.</p>
            ) : quizDone ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
              >
                <div className="text-5xl mb-4">
                  {score >= Math.ceil(quizQuestions.length * 0.8) ? "🏆" : score >= Math.ceil(quizQuestions.length * 0.4) ? "👍" : "📚"}
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  Skor: {score}/{quizQuestions.length}
                </h3>
                <p className="text-gray-400 mb-6">
                  {score >= Math.ceil(quizQuestions.length * 0.8)
                    ? "Luar biasa! Pengetahuan keselamatan Anda sangat baik."
                    : score >= Math.ceil(quizQuestions.length * 0.4)
                    ? "Cukup baik! Terus pelajari materi keselamatan."
                    : "Yuk pelajari lagi materi keselamatan di atas!"}
                </p>
                <button
                  onClick={resetQuiz}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  <RefreshCw size={16} /> Ulangi Kuis
                </button>
              </motion.div>
            ) : currentQ ? (
              <motion.div
                key={quizIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400">
                    Pertanyaan {quizIndex + 1} / {quizQuestions.length}
                  </span>
                  <span className="text-xs text-blue-400 font-medium">Skor: {score}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-5">
                  <div
                    className="h-1.5 bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(quizIndex / quizQuestions.length) * 100}%` }}
                  />
                </div>

                <p className="font-semibold mb-4 leading-snug">{currentQ.q}</p>

                <div className="space-y-2 mb-4">
                  {currentQ.options.map((opt, i) => {
                    let style = "bg-white/5 border-white/10 hover:bg-white/10";
                    if (selected !== null) {
                      if (i === currentQ.answer) style = "bg-green-500/20 border-green-500/40";
                      else if (i === selected) style = "bg-red-500/20 border-red-500/40";
                      else style = "bg-white/5 border-white/10 opacity-50";
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${style}`}
                      >
                        <span className="font-medium text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3 rounded-xl mb-4 text-sm ${
                      isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                    )}
                    <p className="text-gray-300">{currentQ.explanation}</p>
                  </motion.div>
                )}

                {selected !== null && (
                  <button
                    onClick={nextQuestion}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {quizIndex + 1 >= quizQuestions.length ? "Lihat Hasil" : "Pertanyaan Berikutnya →"}
                  </button>
                )}
              </motion.div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Emergency Simulation ── */}
      <section className="bg-gradient-to-br from-red-950/30 via-gray-950 to-gray-950 border-y border-red-900/20 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <SectionLabel icon={AlertTriangle} color="text-red-400" label="Simulasi Darurat" />
          <h2 className="text-2xl font-bold mb-2">Panduan Saat Kecelakaan</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-lg">
            Ikuti langkah-langkah berikut secara berurutan untuk memastikan keselamatan semua pihak.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                <div className="text-5xl font-black text-red-900/50 mb-3">{s.step}</div>
                <div className={`p-2 rounded-xl bg-white/10 w-fit mb-3 ${s.color}`}>
                  <s.icon size={18} />
                </div>
                <h3 className={`font-bold mb-2 ${s.color}`}>{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Emergency contacts bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-red-950/40 border border-red-900/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-bold mb-1">Nomor Darurat</h3>
              <p className="text-gray-400 text-sm">Simpan nomor-nomor ini di ponsel Anda.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
              {[
                { label: "110 — Polisi", href: "tel:110" },
                { label: "118 — Ambulans", href: "tel:118" },
                { label: "113 — Damkar", href: "tel:113" },
              ].map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  <Phone size={14} />
                  {c.label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  color,
  label,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${color}`}>
      <Icon size={15} />
      {label}
    </div>
  );
}

// CSS injected once for poster scroll animation
const POSTER_SCROLL_CSS = `
  @keyframes poster-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .poster-track {
    animation: poster-scroll 20s linear infinite;
  }
  .poster-track:hover {
    animation-play-state: paused;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("poster-scroll-css")) {
  const s = document.createElement("style");
  s.id = "poster-scroll-css";
  s.textContent = POSTER_SCROLL_CSS;
  document.head.appendChild(s);
}

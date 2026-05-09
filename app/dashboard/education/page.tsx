"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Image, HelpCircle, Plus, Pencil, Trash2,
  X, Save, RefreshCw, CheckCircle2, AlertTriangle, GripVertical,
  Upload, ImageOff,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
interface Poster {
  id: string;
  title: string;
  tag: string;
  color: string;
  icon: string;
  imageUrl?: string | null;
}

interface Quiz {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

const GRADIENT_OPTIONS = [
  "from-blue-600 to-blue-800",
  "from-purple-600 to-purple-800",
  "from-green-600 to-green-800",
  "from-cyan-600 to-cyan-800",
  "from-orange-600 to-orange-800",
  "from-yellow-600 to-yellow-800",
  "from-red-600 to-red-800",
  "from-pink-600 to-pink-800",
];

// ── Poster Form Modal ──────────────────────────────────────────────
function PosterModal({ initial, onSave, onClose }: {
  initial?: Poster;
  onSave: (p: Poster, imageFile: File | null, removeImage: boolean) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Poster, "id">>({
    title: initial?.title ?? "",
    tag:   initial?.tag   ?? "",
    color: initial?.color ?? GRADIENT_OPTIONS[0],
    icon:  initial?.icon  ?? "📋",
    imageUrl: initial?.imageUrl ?? null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setPreview(null);
    setRemoveImage(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">{initial ? "Edit Poster" : "Tambah Poster"}</h3>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <Field label="Judul">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-base" placeholder="Judul poster..." />
          </Field>
          <Field label="Tag">
            <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="input-base" placeholder="ZoSS, Helm, Hujan..." />
          </Field>
          <Field label="Ikon (emoji)">
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="input-base" placeholder="🏫" />
          </Field>
          <Field label="Warna Gradien">
            <div className="grid grid-cols-4 gap-2">
              {GRADIENT_OPTIONS.map((g) => (
                <button key={g} onClick={() => setForm({ ...form, color: g })}
                  className={`h-8 rounded-lg bg-gradient-to-br ${g} border-2 transition-all ${form.color === g ? "border-white scale-105" : "border-transparent"}`}
                />
              ))}
            </div>
          </Field>

          {/* Image upload */}
          <Field label="Gambar Poster (opsional)">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-36 object-cover" />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-600/80 rounded-lg transition-colors"
                >
                  <X size={13} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 rounded-xl py-5 transition-colors text-gray-500 hover:text-gray-400"
              >
                <Upload size={18} />
                <span className="text-xs">Klik untuk unggah gambar</span>
              </button>
            )}
          </Field>

          {/* Preview */}
          <div className={`rounded-xl bg-gradient-to-br ${form.color} p-4 flex items-center gap-3`}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <span className="text-2xl">{form.icon || "📋"}</span>
            )}
            <div>
              <p className="text-xs font-medium bg-black/30 rounded-full px-2 py-0.5 w-fit mb-1">{form.tag || "Tag"}</p>
              <p className="text-sm font-semibold">{form.title || "Judul Poster"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => { if (form.title && form.tag) onSave({ ...form, id: initial?.id ?? "" }, imageFile, removeImage); }}
          disabled={!form.title || !form.tag}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          <Save size={14} /> Simpan
        </button>
      </motion.div>
    </div>
  );
}

// ── Quiz Form Modal ────────────────────────────────────────────────
function QuizModal({ initial, onSave, onClose }: {
  initial?: Quiz;
  onSave: (q: Quiz) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Quiz, "id">>({
    q:           initial?.q           ?? "",
    options:     initial?.options     ?? ["", "", "", ""],
    answer:      initial?.answer      ?? 0,
    explanation: initial?.explanation ?? "",
  });

  const setOption = (i: number, v: string) => {
    const opts = [...form.options];
    opts[i] = v;
    setForm({ ...form, options: opts });
  };

  const valid = form.q.trim() && form.options.every((o) => o.trim()) && form.explanation.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">{initial ? "Edit Pertanyaan" : "Tambah Pertanyaan"}</h3>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <Field label="Pertanyaan">
            <textarea value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })}
              rows={2} className="input-base resize-none" placeholder="Tulis pertanyaan..." />
          </Field>

          <Field label="Pilihan Jawaban (klik untuk tandai jawaban benar)">
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => setForm({ ...form, answer: i })}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      form.answer === i ? "border-green-500 bg-green-500/20 text-green-400" : "border-white/20 text-gray-600"
                    }`}
                  >
                    {form.answer === i ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>}
                  </button>
                  <input value={opt} onChange={(e) => setOption(i, e.target.value)}
                    className="input-base flex-1" placeholder={`Pilihan ${String.fromCharCode(65 + i)}...`} />
                </div>
              ))}
            </div>
          </Field>

          <Field label="Penjelasan Jawaban">
            <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              rows={3} className="input-base resize-none" placeholder="Jelaskan mengapa jawaban tersebut benar..." />
          </Field>
        </div>

        <button
          onClick={() => { if (valid) onSave({ ...form, id: initial?.id ?? "" }); }}
          disabled={!valid}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          <Save size={14} /> Simpan
        </button>
      </motion.div>
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function EducationAdminPage() {
  const [tab, setTab]           = useState<"posters" | "quizzes">("posters");
  const [posters, setPosters]   = useState<Poster[]>([]);
  const [quizzes, setQuizzes]   = useState<Quiz[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<string | null>(null);
  const [editPoster, setEditPoster] = useState<Poster | "new" | null>(null);
  const [editQuiz, setEditQuiz]     = useState<Quiz | "new" | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "posters" | "quizzes"; id: string } | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/education");
    const data = await res.json();
    setPosters(data.posters ?? []);
    setQuizzes(data.quizzes ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function savePoster(p: Poster, imageFile: File | null, removeImage: boolean) {
    setSaving(true);
    const fd = new FormData();
    fd.append("title", p.title);
    fd.append("tag", p.tag);
    fd.append("icon", p.icon);
    fd.append("color", p.color);
    if (imageFile) fd.append("image", imageFile);
    if (removeImage) fd.append("removeImage", "true");

    if (p.id) {
      fd.append("id", p.id);
      const res = await fetch("/api/admin/education", { method: "PATCH", body: fd });
      const data = await res.json();
      setPosters((prev) => prev.map((x) => x.id === p.id ? data.item : x));
      showToast("Poster diperbarui");
    } else {
      const res = await fetch("/api/admin/education", { method: "POST", body: fd });
      const data = await res.json();
      setPosters((prev) => [...prev, data.item]);
      showToast("Poster ditambahkan");
    }
    setSaving(false);
    setEditPoster(null);
  }

  async function saveQuiz(q: Quiz) {
    setSaving(true);
    if (q.id) {
      await fetch("/api/admin/education", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "quizzes", item: q }) });
      setQuizzes((prev) => prev.map((x) => x.id === q.id ? q : x));
      showToast("Pertanyaan diperbarui");
    } else {
      const res = await fetch("/api/admin/education", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "quizzes", item: q }) });
      const data = await res.json();
      setQuizzes((prev) => [...prev, { ...q, id: data.id }]);
      showToast("Pertanyaan ditambahkan");
    }
    setSaving(false);
    setEditQuiz(null);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setSaving(true);
    await fetch("/api/admin/education", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(deleteConfirm) });
    if (deleteConfirm.type === "posters") setPosters((p) => p.filter((x) => x.id !== deleteConfirm.id));
    else setQuizzes((q) => q.filter((x) => x.id !== deleteConfirm.id));
    showToast("Dihapus");
    setSaving(false);
    setDeleteConfirm(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-0.5">
              <BookOpen size={13} /> Konten Edukasi
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold">Kelola Edukasi</h1>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
          <TabBtn active={tab === "posters"} onClick={() => setTab("posters")} icon={<Image size={13} />} label={`Poster (${posters.length})`} />
          <TabBtn active={tab === "quizzes"} onClick={() => setTab("quizzes")} icon={<HelpCircle size={13} />} label={`Kuis (${quizzes.length})`} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
            <RefreshCw size={16} className="animate-spin" /> Memuat...
          </div>
        ) : (
          <>
            {/* ── POSTERS ── */}
            {tab === "posters" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">{posters.length} poster aktif di halaman edukasi</p>
                  <button
                    onClick={() => setEditPoster("new")}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    <Plus size={13} /> Tambah Poster
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {posters.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group relative"
                    >
                      <div className={`rounded-2xl ${p.imageUrl ? "bg-gray-900" : `bg-gradient-to-br ${p.color}`} p-4 aspect-[3/4] flex flex-col justify-between overflow-hidden relative`}>
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <span className="relative text-xs font-medium bg-black/30 rounded-full px-2 py-0.5 w-fit">{p.tag}</span>
                        <div className="relative">
                          <div className="text-3xl mb-2">{p.icon}</div>
                          <p className="text-xs font-semibold leading-snug">{p.title}</p>
                        </div>
                      </div>
                      {/* Hover actions */}
                      <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditPoster(p)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: "posters", id: p.id })}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add placeholder */}
                  <button
                    onClick={() => setEditPoster("new")}
                    className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-xs">Tambah</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── QUIZZES ── */}
            {tab === "quizzes" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">{quizzes.length} pertanyaan aktif di mini kuis</p>
                  <button
                    onClick={() => setEditQuiz("new")}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    <Plus size={13} /> Tambah Pertanyaan
                  </button>
                </div>

                <div className="space-y-3">
                  {quizzes.map((q, i) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3 group hover:bg-white/8 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white mb-2 leading-snug">{q.q}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                              oi === q.answer ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-white/5 text-gray-400"
                            }`}>
                              <span className="font-bold flex-shrink-0">{String.fromCharCode(65 + oi)}.</span>
                              <span className="truncate">{opt}</span>
                              {oi === q.answer && <CheckCircle2 size={11} className="flex-shrink-0 ml-auto" />}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{q.explanation}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditQuiz(q)} className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setDeleteConfirm({ type: "quizzes", id: q.id })} className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={() => setEditQuiz("new")}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 rounded-2xl py-5 text-gray-600 hover:text-gray-400 transition-colors text-sm"
                  >
                    <Plus size={16} /> Tambah Pertanyaan Baru
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editPoster && (
          <PosterModal
            initial={editPoster === "new" ? undefined : editPoster}
            onSave={(p, imageFile, removeImage) => savePoster(p, imageFile, removeImage)}
            onClose={() => setEditPoster(null)}
          />
        )}
        {editQuiz && (
          <QuizModal
            initial={editQuiz === "new" ? undefined : editQuiz}
            onSave={saveQuiz}
            onClose={() => setEditQuiz(null)}
          />
        )}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-5 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle size={18} className="text-red-400" /></div>
                <p className="font-semibold">Hapus {deleteConfirm.type === "posters" ? "poster" : "pertanyaan"} ini?</p>
              </div>
              <p className="text-sm text-gray-400 mb-4">Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Batal</button>
                <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {saving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : "Hapus"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white flex items-center gap-2 shadow-2xl"
          >
            <CheckCircle2 size={14} className="text-green-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .input-base {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus { border-color: rgba(59,130,246,0.6); }
        .input-base::placeholder { color: #6b7280; }
      `}</style>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      {icon}{label}
    </button>
  );
}

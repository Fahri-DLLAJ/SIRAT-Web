"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Filter, CheckCircle2, Clock, AlertTriangle,
  X, ChevronDown, Eye, RefreshCw, MessageSquare, Shield, Trash2,
  EyeOff, Plus, MapPin,
} from "lucide-react";
import { Report } from "@/store/appStore";
import { useAppStore } from "@/store/appStore";
import { formatDate } from "@/lib/utils";

type Status   = "all" | "pending" | "active" | "resolved";
type Severity = "all" | "low" | "medium" | "high" | "critical";

const SEV_CLS: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};
const SEV_LABEL: Record<string, string> = { critical: "Kritis", high: "Tinggi", medium: "Sedang", low: "Rendah" };

const STA_CLS: Record<string, string> = {
  active:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};
const STA_LABEL: Record<string, string> = { active: "Aktif", pending: "Menunggu", resolved: "Selesai" };

function SevBadge({ s }: { s: string }) {
  return <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${SEV_CLS[s]}`}>{SEV_LABEL[s]}</span>;
}
function StaBadge({ s }: { s: string }) {
  return <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STA_CLS[s]}`}>{STA_LABEL[s]}</span>;
}

const SEV_OPTIONS: { value: Severity; label: string }[] = [
  { value: "all",      label: "Semua Tingkat" },
  { value: "critical", label: "Kritis"        },
  { value: "high",     label: "Tinggi"        },
  { value: "medium",   label: "Sedang"        },
  { value: "low",      label: "Rendah"        },
];

function SeverityFilter({ value, onChange }: { value: Severity; onChange: (v: Severity) => void }) {
  const [open, setOpen] = useState(false);
  const current = SEV_OPTIONS.find((o) => o.value === value)!;
  return (
    <div className="relative flex-shrink-0">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-full px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors">
        <Filter size={13} className="text-gray-400 flex-shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">{current.label}</span>
        <ChevronDown size={12} className="hidden sm:block text-gray-500" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 mt-1 z-20 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[140px]">
              {SEV_OPTIONS.map((o) => (
                <li key={o.value}>
                  <button onClick={() => { onChange(o.value); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      value === o.value ? "bg-blue-600/20 text-blue-400" : "text-gray-300 hover:bg-white/8 hover:text-white"
                    }`}>
                    {o.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────
function DeleteConfirm({ report, onConfirm, onClose, saving }: {
  report: Report; onConfirm: () => void; onClose: () => void; saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-500/10 rounded-xl"><Trash2 size={18} className="text-red-400" /></div>
          <p className="font-semibold">Hapus laporan ini?</p>
        </div>
        <p className="text-sm text-gray-400 mb-1"><span className="text-white font-medium">{report.type}</span> — {report.location}</p>
        <p className="text-xs text-gray-500 mb-4">Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Batal</button>
          <button onClick={onConfirm} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : "Hapus"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────
function DetailModal({ report, onClose, onAction }: {
  report: Report;
  onClose: () => void;
  onAction: (id: string, action: string, payload?: Record<string, string>) => Promise<void>;
}) {
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: string, payload?: Record<string, string>) {
    setLoading(action);
    await onAction(report.id, action, payload);
    setLoading(null);
    if (action !== "addNote") onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-orange-400" />
            <span className="font-semibold text-sm">{report.type}</span>
            <SevBadge s={report.severity} />
            <StaBadge s={report.status} />
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-gray-500 mb-0.5">ID</p><p className="font-mono text-gray-300 break-all">{report.id}</p></div>
            <div><p className="text-gray-500 mb-0.5">Waktu</p><p className="text-gray-300">{formatDate(report.timestamp)}</p></div>
            <div className="col-span-2"><p className="text-gray-500 mb-0.5">Lokasi</p><p className="text-gray-300">{report.location}</p></div>
            {report.name && <div><p className="text-gray-500 mb-0.5">Pelapor</p><p className="text-gray-300">{report.name}</p></div>}
            {report.phone && <div><p className="text-gray-500 mb-0.5">Telepon</p><p className="text-gray-300">{report.phone}</p></div>}
            {report.description && (
              <div className="col-span-2"><p className="text-gray-500 mb-0.5">Deskripsi</p><p className="text-gray-300">{report.description}</p></div>
            )}
          </div>

          {report.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={report.imageUrl} alt="Bukti" className="w-full rounded-xl object-cover max-h-48 border border-white/10" />
          )}

          {report.statusHistory && report.statusHistory.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Riwayat Status</p>
              <div className="space-y-1.5">
                {report.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <StaBadge s={h.status} />
                    <span className="text-gray-400 flex-1">{h.note}</span>
                    <span className="text-gray-600 shrink-0">{formatDate(h.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.notes && report.notes.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Catatan</p>
              <ul className="space-y-1">
                {report.notes.map((n, i) => (
                  <li key={i} className="text-xs text-gray-300 bg-white/5 rounded-lg px-3 py-2">{n}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambah catatan..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <button onClick={() => { if (note.trim()) { act("addNote", { note }); setNote(""); } }}
              disabled={!note.trim() || loading === "addNote"}
              className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors disabled:opacity-40">
              <MessageSquare size={13} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {report.status === "pending" && (
              <button onClick={() => act("verify")} disabled={loading === "verify"}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg text-xs transition-colors disabled:opacity-40">
                {loading === "verify" ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Verifikasi
              </button>
            )}
            {report.status !== "resolved" && (
              <button onClick={() => act("complete", { note: "Laporan diselesaikan oleh admin." })} disabled={loading === "complete"}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors disabled:opacity-40">
                {loading === "complete" ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
                Selesaikan
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add Report Modal ──────────────────────────────────────────────
const REPORT_TYPES = ["Jalan Rusak", "Kondisi Berbahaya", "Kecelakaan", "Banjir", "Hambatan Jalan", "Pemadaman", "Lainnya"];
const SEVERITIES   = ["low", "medium", "high", "critical"] as const;
const SEV_LABEL_ADD: Record<string, string> = { low: "Rendah", medium: "Sedang", high: "Tinggi", critical: "Kritis" };

function AddReportModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (body: Record<string, string>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "Admin", phone: "", type: REPORT_TYPES[0],
    description: "", location: "", lat: "", lng: "",
    severity: "medium", status: "active",
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.location || !form.lat || !form.lng) return;
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Plus size={15} className="text-blue-400" />
            <span className="font-semibold text-sm">Tambah Laporan (Admin)</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Jenis</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50">
                {REPORT_TYPES.map((t) => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Tingkat Keparahan</label>
              <select value={form.severity} onChange={(e) => set("severity", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50">
                {SEVERITIES.map((s) => <option key={s} value={s} className="bg-gray-900">{SEV_LABEL_ADD[s]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Lokasi (nama jalan/daerah)</label>
            <div className="relative">
              <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input required value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="Contoh: Jalan Raya Klaten, Klaten Utara"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Latitude</label>
              <input required type="number" step="any" value={form.lat} onChange={(e) => set("lat", e.target.value)}
                placeholder="-7.7059"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Longitude</label>
              <input required type="number" step="any" value={form.lng} onChange={(e) => set("lng", e.target.value)}
                placeholder="110.6010"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Deskripsi</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3} placeholder="Deskripsi kondisi..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Nama Pelapor</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Status Awal</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50">
                <option value="active" className="bg-gray-900">Aktif</option>
                <option value="pending" className="bg-gray-900">Menunggu</option>
                <option value="resolved" className="bg-gray-900">Selesai</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">Batal</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {saving ? <RefreshCw size={14} className="animate-spin mx-auto" /> : "Simpan Laporan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function DashboardReportsPage() {
  const { reports, setReports } = useAppStore();
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [severityFilter, setSeverityFilter] = useState<Severity>("all");
  const [selected, setSelected]         = useState<Report | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [togglingId, setTogglingId]     = useState<string | null>(null);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/report");
      const data = await res.json();
      if (data.ok) setReports([...data.reports].reverse());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReports(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAction(id: string, action: string, payload?: Record<string, string>) {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, payload }),
    });
    const data = await res.json();
    if (data.ok) {
      setReports(reports.map((r) => (r.id === id ? (data.report as Report) : r)));
      setSelected((prev) => (prev?.id === id ? (data.report as Report) : prev));
    }
  }

  async function handleToggleHide(r: Report) {
    setTogglingId(r.id);
    const action = r.hidden ? "unhide" : "hide";
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, action }),
    });
    const data = await res.json();
    if (data.ok) {
      setReports(reports.map((x) => (x.id === r.id ? (data.report as Report) : x)));
      setSelected((prev) => (prev?.id === r.id ? (data.report as Report) : prev));
    }
    setTogglingId(null);
  }

  async function handleAddReport(body: Record<string, string>) {
    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok) setReports([data.report as Report, ...reports]);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch("/api/admin/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    setReports(reports.filter((r) => r.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    setSelected(null);
  }

  const filtered = reports.filter((r) => {
    const matchSearch = search === "" ||
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSev    = severityFilter === "all" || r.severity === severityFilter;
    return matchSearch && matchStatus && matchSev;
  });

  const counts = {
    all:      reports.length,
    pending:  reports.filter((r) => r.status === "pending").length,
    active:   reports.filter((r) => r.status === "active").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/5 bg-slate-950/90 backdrop-blur-xl sticky top-14 z-20 shadow-sm shadow-black/5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-400 text-xs font-medium mb-1">
              <FileText size={14} strokeWidth={2} /> Manajemen Laporan
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Semua Laporan</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 font-semibold">
              <Plus size={13} strokeWidth={2} /> Tambah
            </button>
            <button onClick={fetchReports}
              className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={13} strokeWidth={2} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Stat tabs */}
        <div className="grid grid-cols-4 gap-2">
          {(["all", "pending", "active", "resolved"] as Status[]).map((s) => {
            const icons  = { all: FileText, pending: Clock, active: AlertTriangle, resolved: CheckCircle2 };
            const colors = { all: "text-gray-400", pending: "text-yellow-400", active: "text-green-400", resolved: "text-blue-400" };
            const labels = { all: "Semua", pending: "Menunggu", active: "Aktif", resolved: "Selesai" };
            const Icon   = icons[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-colors ${
                  statusFilter === s ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/8"
                }`}>
                <Icon size={14} className={colors[s]} />
                <span className={`text-lg font-extrabold ${colors[s]}`}>{counts[s]}</span>
                <span className="text-[10px] text-gray-500">{labels[s]}</span>
              </button>
            );
          })}
        </div>

        {/* Search & filter */}
        <div className="flex flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari ID, jenis, atau lokasi..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
          </div>
          <SeverityFilter value={severityFilter} onChange={setSeverityFilter} />
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm gap-2">
              <RefreshCw size={14} className="animate-spin" /> Memuat laporan...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
              <FileText size={28} className="opacity-30" />
              <p className="text-sm">Tidak ada laporan ditemukan</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8 text-gray-500 text-[11px] uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">ID</th>
                      <th className="text-left px-5 py-3 font-medium">Jenis</th>
                      <th className="text-left px-5 py-3 font-medium">Lokasi</th>
                      <th className="text-left px-5 py-3 font-medium">Tingkat</th>
                      <th className="text-left px-5 py-3 font-medium">Status</th>
                      <th className="text-left px-5 py-3 font-medium">Waktu</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((r, i) => (
                      <motion.tr key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 font-mono text-gray-500 text-[10px]">{r.id.slice(0, 14)}…</td>
                        <td className={`px-5 py-3 font-medium cursor-pointer ${r.hidden ? "text-gray-500 line-through" : "text-white"}`} onClick={() => setSelected(r)}>{r.type}</td>
                        <td className="px-5 py-3 text-gray-400 max-w-[180px] truncate">{r.location}</td>
                        <td className="px-5 py-3"><SevBadge s={r.severity} /></td>
                        <td className="px-5 py-3"><StaBadge s={r.status} /></td>
                        <td className="px-5 py-3 text-gray-500">{formatDate(r.timestamp)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelected(r)} className="text-gray-600 hover:text-blue-400 transition-colors"><Eye size={13} /></button>
                            <button onClick={() => handleToggleHide(r)} disabled={togglingId === r.id}
                              title={r.hidden ? "Tampilkan di peta" : "Sembunyikan dari peta"}
                              className={`transition-colors disabled:opacity-40 ${
                                r.hidden ? "text-yellow-500 hover:text-yellow-300" : "text-gray-600 hover:text-yellow-400"
                              }`}>
                              {togglingId === r.id ? <RefreshCw size={13} className="animate-spin" /> : <EyeOff size={13} />}
                            </button>
                            <button onClick={() => setDeleteTarget(r)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-white/5">
                {filtered.map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelected(r)}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-xs font-semibold truncate ${r.hidden ? "text-gray-500 line-through" : "text-white"}`}>{r.type}</p>
                        <SevBadge s={r.severity} />
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{r.location}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(r.timestamp)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StaBadge s={r.status} />
                      <button onClick={() => handleToggleHide(r)} disabled={togglingId === r.id}
                        className={`transition-colors disabled:opacity-40 p-1 ${
                          r.hidden ? "text-yellow-500" : "text-gray-600 hover:text-yellow-400"
                        }`}>
                        {togglingId === r.id ? <RefreshCw size={13} className="animate-spin" /> : <EyeOff size={13} />}
                      </button>
                      <button onClick={() => setDeleteTarget(r)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-[11px] text-gray-600 text-center">
            Menampilkan {filtered.length} dari {reports.length} laporan
          </p>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <AddReportModal onClose={() => setShowAddForm(false)} onSubmit={handleAddReport} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <DetailModal report={selected} onClose={() => setSelected(null)} onAction={handleAction} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm report={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} saving={deleting} />
        )}
      </AnimatePresence>
    </div>
  );
}

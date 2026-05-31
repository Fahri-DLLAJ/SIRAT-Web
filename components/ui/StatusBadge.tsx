import { getStatusColor } from "@/lib/utils";

interface Props {
  status: "active" | "resolved" | "pending" | "offline";
  label?: string;
}

const labelMap = {
  active: "Aktif",
  resolved: "Selesai",
  pending: "Menunggu",
  offline: "Offline",
};

const statusStyles = {
  active:   { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  resolved: { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/30",     dot: "bg-sky-400"     },
  pending:  { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400"   },
  offline:  { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30",   dot: "bg-slate-400"   },
};

export default function StatusBadge({ status, label }: Props) {
  const style = statusStyles[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shadow-sm`} />
      {label ?? labelMap[status]}
    </span>
  );
}

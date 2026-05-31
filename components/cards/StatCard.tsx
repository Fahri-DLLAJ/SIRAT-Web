import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delay?: number;
}

export default function StatCard({ icon: Icon, label, value, sub, color = "text-emerald-400", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500 rounded-2xl" />
      
      {/* Icon with refined styling */}
      <div className={`relative p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      
      {/* Content */}
      <div className="relative">
        <p className="text-2xl font-bold text-white tracking-tight mb-0.5">{value}</p>
        <p className="text-sm text-slate-300 font-medium">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

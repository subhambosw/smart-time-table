import React from "react";
import { motion } from "framer-motion";

function StatCard({ value, label }) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-center transition-all hover:bg-slate-800/40 shadow-lg shadow-black/20">
      <div className="text-4xl font-bold text-slate-100 mb-2 tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function StatGrid({ stats }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard value={stats.totalClasses} label="CLASSES / WEEK" />
      <StatCard value={`${stats.hoursPerWeek}h`} label="HOURS / WEEK" />
      <StatCard value={stats.uniqueSubjects} label="SUBJECTS" />
      <StatCard value={stats.busiestDay} label="BUSIEST DAY" />
    </motion.div>
  );
}

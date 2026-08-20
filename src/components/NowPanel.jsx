import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, BookOpen, Clock, PartyPopper } from "lucide-react";

export default function NowPanel({ nowState }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={nowState.type} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
        {nowState.type === 'weekend' || nowState.type === 'after' ? (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-md flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl"><PartyPopper className="w-8 h-8 text-indigo-300" /></div>
            <div>
              <h2 className="text-xl font-semibold text-indigo-100">All wrapped up for today!</h2>
              <p className="text-indigo-200/80">Great job. Time to relax and recharge.</p>
            </div>
          </div>
        ) : nowState.type === 'active' ? (
          <div className={`p-6 rounded-2xl border backdrop-blur-md flex items-center justify-between flex-wrap gap-4 shadow-lg ${nowState.current.type === 'lunch' ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-emerald-500/5' : 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-blue-500/5'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${nowState.current.type === 'lunch' ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                {nowState.current.type === 'lunch' ? <Coffee className="w-8 h-8 text-emerald-300"/> : <BookOpen className="w-8 h-8 text-blue-300"/>}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">{nowState.current.type === 'lunch' ? 'Lunch Break' : 'Current Class'}</h2>
                <p className="text-slate-400">{nowState.current.text}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-700/50 text-lg font-medium text-slate-200 backdrop-blur-sm">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>{nowState.remaining} min left</span>
            </div>
          </div>
        ) : nowState.type === 'passing' ? (
          <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-md flex items-center gap-4">
            <p className="text-slate-300">Passing period... next class in {nowState.remaining} minutes.</p>
          </div>
        ) : (
           <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-md flex items-center gap-4">
             <p className="text-slate-300">Classes haven't started yet. Have a great day ahead!</p>
           </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

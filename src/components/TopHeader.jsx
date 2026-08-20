import React from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, AlignJustify, Plus, Search, MoreVertical, Zap } from "lucide-react";

export default function TopHeader({ activeDayIndex, setActiveDayIndex, viewMode, setViewMode, days }) {
  return (
    <header className="h-[72px] flex-shrink-0 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-10 relative">
      <div className="flex items-center gap-6 overflow-hidden">
        <div className="flex items-center gap-4 flex-shrink-0">
          <h1 className="text-lg sm:text-xl font-semibold text-white whitespace-nowrap">Aug 2026</h1>
          <div className="flex gap-2 text-slate-400">
            <ChevronLeft className="w-5 h-5 cursor-pointer hover:text-white transition-colors" onClick={() => setActiveDayIndex(p => Math.max(0, p-1))} />
            <ChevronRight className="w-5 h-5 cursor-pointer hover:text-white transition-colors" onClick={() => setActiveDayIndex(p => Math.min(4, p+1))} />
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 overflow-x-auto px-4 border-l border-slate-700/50 scrollbar-hide py-1">
          {days.map((day, i) => (
            <div 
              key={i} 
              onClick={() => setActiveDayIndex(i)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all flex-shrink-0 ${activeDayIndex === i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/60'}`}
            >
              <span>{10 + i}</span>
              <span className={activeDayIndex === i ? 'text-indigo-100' : 'text-slate-400 font-normal'}>{day.substring(0,3)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 mr-2">
          <button onClick={() => setViewMode('week')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'week' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('day')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'day' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>
        <button className="hidden md:block px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 text-slate-200 text-sm font-medium rounded-xl border border-slate-700/50 transition-colors backdrop-blur-sm">
          Availability
        </button>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Meet</span>
        </button>
      </div>
    </header>
  );
}

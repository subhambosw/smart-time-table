import React from "react";
import { ChevronLeft, ChevronRight, Search, Plus } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-[280px] flex-shrink-0 border-r border-slate-800/50 bg-slate-900/40 backdrop-blur-xl flex-col overflow-y-auto hidden md:flex pb-8">
      <div className="p-5 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">August 2026</h2>
            <div className="flex gap-2 text-slate-400">
              <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
              <ChevronRight className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-center">
            {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-slate-500 mb-2 font-medium">{d}</div>)}
            {[...Array(31)].map((_, i) => (
              <div key={i} className={`p-1.5 rounded-full cursor-pointer transition-colors ${i===10 ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-medium' : 'text-slate-300 hover:bg-slate-800/80'}`}>
                {i+1}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Find calendar or room" className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500" />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">My Calendars</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer mt-4 pt-2">
              <Plus className="w-4 h-4" /> Add calendar
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Todo</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer mt-4 pt-2">
              <Plus className="w-4 h-4" /> Add Todo
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

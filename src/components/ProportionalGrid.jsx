import React from "react";
import { getDaySchedule } from "../lib/schedule.js";

export default function ProportionalGrid({ timetable, bounds, totalMinutes, viewMode, activeDayIndex, currentDayIndex, nowMinutes, days, onBlockClick }) {
  
  const getTop = (startMins) => ((startMins - bounds.start) / totalMinutes) * 100 + "%";
  const getHeight = (startMins, endMins) => ((endMins - startMins) / totalMinutes) * 100 + "%";

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl p-6 h-[800px] relative flex">
      {/* Time axis */}
      <div className="w-16 flex-shrink-0 relative border-r border-slate-700/50 mr-4">
        {[...Array(9)].map((_, i) => {
          const hour = 9 + i;
          const mins = hour * 60;
          if (mins < bounds.start || mins > bounds.end) return null;
          return (
            <div key={hour} className="absolute text-xs text-slate-500 -mt-2 w-full text-right pr-2" style={{ top: getTop(mins) }}>
              {hour}:00
            </div>
          );
        })}
      </div>

      {/* Day Columns */}
      <div className={`flex-1 flex gap-4 relative ${viewMode === 'day' ? 'justify-center' : ''}`}>
        {days.map((dayName, dayIdx) => {
          if (viewMode === 'day' && dayIdx !== activeDayIndex) return null;
          
          const schedule = getDaySchedule(dayIdx, timetable, days);
          const isToday = currentDayIndex === dayIdx;

          return (
            <div key={dayName} className="flex-1 relative h-full bg-slate-800/20 rounded-lg">
              <div className="text-center font-medium text-slate-400 py-2 sticky top-0 bg-slate-900/80 z-10 backdrop-blur-md rounded-t-lg border-b border-slate-700/50">
                {dayName}
                {isToday && <div className="text-xs text-indigo-400 font-normal">Today</div>}
              </div>

              <div className="relative w-full h-[calc(100%-48px)] mt-2">
                {schedule.map(block => {
                  const isLunch = block.type === 'lunch';
                  return (
                    <div 
                      key={block.id}
                      onClick={() => onBlockClick(block, dayName, block.start)}
                      className={`absolute w-full rounded-lg p-2 border transition-all cursor-pointer hover:scale-[1.02] shadow-md flex flex-col justify-center items-center text-center
                        ${isLunch ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20' 
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200 hover:bg-indigo-500/20'}`}
                      style={{
                        top: getTop(block.start),
                        height: getHeight(block.start, block.end),
                      }}
                    >
                      <div className="font-semibold text-sm">{block.text}</div>
                      <div className="text-xs opacity-70">
                        {Math.floor(block.start/60)}:{(block.start%60).toString().padStart(2,'0')} - 
                        {Math.floor(block.end/60)}:{(block.end%60).toString().padStart(2,'0')}
                      </div>
                    </div>
                  );
                })}

                {/* Now Line */}
                {isToday && nowMinutes >= bounds.start && nowMinutes <= bounds.end && (
                  <div 
                    className="absolute w-full border-t-2 border-rose-500 z-20 flex items-center justify-end shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    style={{ top: getTop(nowMinutes) }}
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-500 -mr-1"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

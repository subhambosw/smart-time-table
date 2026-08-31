import React, { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, LayoutGrid, AlignJustify,
  Sun, Moon, Monitor, Utensils, ArrowRight, CircleDot,
  BookOpen, Clock, PencilLine,
} from "lucide-react";
import "./App.css";
import { DAYS, SESSIONS as DEFAULT_SESSIONS, STUDENT_NAME } from "./data/timetable.js";

/* ─── Timetable version: bump this manually whenever you want all devices
   to drop their locally-saved edits and reload from timetable.js.
   Current: v3  (bumped 2026-08-31 to force reset of stale CyberSecurity data) */
const TT_VERSION = "v3";
import { toMinutes, getCurrentTimeMinutes } from "./lib/time.js";
import { getNowState, getDaySchedule } from "./lib/schedule.js";

/* ─── helpers ─────────────────────────────────────────────────── */
const GREETINGS = {
  morning: [
    "Rise and shine",
    "Oh look, you're awake",
    "Morning, legend",
    "Another day, another caffeine IV",
    "You're up early. Suspicious",
  ],
  afternoon: [
    "Still going strong",
    "Half the day's gone. Panic later",
    "Afternoon energy loading…",
    "You survived the morning. Impressive",
    "It's giving 'functioning adult'",
  ],
  evening: [
    "Burning the midnight oil already?",
    "The grind never sleeps, apparently",
    "Evening, you beautiful disaster",
    "Still here? Respect.",
    "Clocking in after hours. Classic",
  ],
};
const greet = (h) => {
  const pool = h < 12 ? GREETINGS.morning : h < 17 ? GREETINGS.afternoon : GREETINGS.evening;
  return pool[Math.floor(Date.now() / 60000) % pool.length];
};
const fmtMins = (t) => { const h = Math.floor(t/60), m = t%60; return m ? `${h}h ${m}m` : `${h}h`; };
const fmt12 = (m) => { const h=Math.floor(m/60), mm=m%60, hh=h>12?h-12:h||12, ap=h>=12?"PM":"AM"; return `${hh}:${mm.toString().padStart(2,"0")} ${ap}`; };

const DEFAULT_COLORS = {
  WebDev:"#f9a8d4", Nand:"#f87171", ML:"#a78bfa", DBMS:"#4ade80",
  DSA:"#fbbf24", Coding:"#22d3ee", Community:"#c084fc", Verbal:"#fb923c",
};

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + weekOffset * 7);
  const dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return DAYS.map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}

function getDayStats(di, tt) {
  const name=DAYS[di]; let cls=0,mins=0,lunch=null,free=0;
  tt.forEach(r=>{
    const t = r.days[name];
    // undefined = this day has no entry at all (shouldn't happen) — skip
    if (t === undefined) return;
    // empty string = explicitly free slot
    if (t === "") { free++; return; }
    if (t === "Lunch") { lunch = r.start; return; }
    cls++;
    mins += toMinutes(r.end) - toMinutes(r.start);
  });
  return {cls, mins, lunch, free};
}

function buildCal(y, m) {
  const fd = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const days = Array(fd).fill(null);
  for (let d = 1; d <= dim; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function resolveTheme(mode) {
  if (mode === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return mode;
}

/* ─── MAIN APP ─────────────────────────────────────────────────── */
export default function App() {
  const [now, setNow]         = useState(() => new Date());
  const [tt, setTt]           = useState(DEFAULT_SESSIONS);
  const [view, setView]       = useState("week");
  // dayIdx = the day the user is BROWSING (0=Mon … 4=Fri).
  // On a weekday: use today's weekday index.
  // On a weekend: default to Monday (0) of the NEXT week.
  const [dayIdx, setDayIdx]   = useState(() => {
    const d = new Date().getDay() - 1; // -1=Sun, 0-4=Mon-Fri, 5=Sat
    return d >= 0 && d <= 4 ? d : 0;   // weekend → upcoming Monday
  });
  // weekOffset: 0 for weekdays (current week), 1 for weekends (upcoming week).
  const [weekOffset, setWeekOffset] = useState(() => {
    const dow = new Date().getDay(); // 0=Sun, 6=Sat
    return (dow === 0 || dow === 6) ? 1 : 0;
  });
  const [theme, setTheme]     = useState(() => localStorage.getItem("tt_theme") || "dark");
  const [sel, setSel]         = useState(null);
  const [schedOpen, setSchedOpen] = useState(false); // controls schedule editor dialog
  const [schedEdit, setSchedEdit] = useState(null);  // {si, dayName} — which cell is being edited
  const [colors, setColors]   = useState(() => {
    try { const s = localStorage.getItem("tt_colors"); return s ? JSON.parse(s) : DEFAULT_COLORS; } catch { return DEFAULT_COLORS; }
  });
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex]   = useState("#4f63f8");
  const dlg = useRef(null);
  const schedDlg = useRef(null);
  // Track the last known date-string so midnight detection only fires on genuine day changes.
  const prevDateStrRef = useRef(new Date().toDateString());

  /* derived color helper — must be inside App so it picks up `colors` state */
  const subjectColor = (t) => { const k = Object.keys(colors).find(k => t?.startsWith(k)); return k ? colors[k] : "#94a3b8"; };

  /* theme */
  useEffect(() => {
    localStorage.setItem("tt_theme", theme);
    document.documentElement.dataset.theme = resolveTheme(theme);
  }, [theme]);
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => { document.documentElement.dataset.theme = mq.matches ? "dark" : "light"; };
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, [theme]);

  /* ── persist: version-guarded localStorage ──────────────────────
     If the stored version key matches TT_VERSION we load the user's
     saved edits.  If it doesn't (new deploy with changed timetable.js)
     we discard the stale data so the new canonical schedule shows up
     on every device automatically.                                    */
  useEffect(() => {
    const storedVer = localStorage.getItem("tt_version");
    if (storedVer === TT_VERSION) {
      const s = localStorage.getItem("smartTimetable");
      if (s) { try { setTt(JSON.parse(s)); } catch {} }
    } else {
      // New deploy — clear stale data, start from canonical timetable.js
      localStorage.removeItem("smartTimetable");
      localStorage.setItem("tt_version", TT_VERSION);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    localStorage.setItem("smartTimetable", JSON.stringify(tt));
    localStorage.setItem("tt_version", TT_VERSION);
  }, [tt]);
  useEffect(() => { localStorage.setItem("tt_colors", JSON.stringify(colors)); }, [colors]);
  // Clock ticks every 60 s so nowMins stays accurate.
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);

  /* midnight / day-change detection
     Runs on every now-tick, but resets the UI only when the calendar DATE
     actually changes (not on the initial mount — that would clobber the
     correct initial dayIdx derived from the useState initialiser above). */
  useEffect(() => {
    const newDateStr = now.toDateString();
    if (newDateStr === prevDateStrRef.current) return; // same day — do nothing
    prevDateStrRef.current = newDateStr;
    // Genuine day change: jump to new today
    const d   = now.getDay() - 1; // -1=Sun, 0-4=Mon-Fri, 5=Sat
    const isWeekend = d < 0 || d > 4;
    setDayIdx(isWeekend ? 0 : d);         // weekend → upcoming Monday
    setWeekOffset(isWeekend ? 1 : 0);     // weekend → next week
  }, [now]);

  /* keyboard */
  useEffect(() => {
    const kd = (e) => {
      if (dlg.current?.open) { if (e.key === "Escape") dlg.current.close(); return; }
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") setDayIdx(p => Math.max(0, p - 1));
      else if (e.key === "ArrowRight") setDayIdx(p => Math.min(4, p + 1));
      else if (e.key === "t" || e.key === "T") { const d = new Date().getDay() - 1; if (d >= 0 && d <= 4) setDayIdx(d); setWeekOffset(0); }
      else if (e.key === "w" || e.key === "W") setView("week");
      else if (e.key === "d" || e.key === "D") setView("day");
    };
    window.addEventListener("keydown", kd); return () => window.removeEventListener("keydown", kd);
  }, []);

  /* derived */
  // todayIdx: real current weekday index (-1=Sun, 0-4=Mon-Fri, 5=Sat)
  const todayIdx  = now.getDay() - 1;
  const nowMins   = getCurrentTimeMinutes(now);
  // nowState always based on the REAL today
  const nowState  = getNowState(nowMins, todayIdx, tt, DAYS);
  const weekDates = getWeekDates(weekOffset);
  // stats for the BROWSED day (timetable/day strip)
  const stats     = getDayStats(dayIdx, tt);
  // todayStats for At-a-Glance, Done-for-Today (always real today)
  const todayStats = todayIdx >= 0 && todayIdx <= 4 ? getDayStats(todayIdx, tt) : { cls: 0, mins: 0, lunch: null, free: 0 };
  // actual day name including weekends
  const ALL_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayDayName = ALL_DAYS[now.getDay()];

  /* month label for the day strip */
  const stripMonth = (() => {
    const first = weekDates[0], last = weekDates[4];
    if (first.getMonth() === last.getMonth())
      return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
    return `${MONTH_NAMES[first.getMonth()].slice(0,3)} – ${MONTH_NAMES[last.getMonth()].slice(0,3)} ${last.getFullYear()}`;
  })();

  /* up next — always calculated from REAL today */
  const upNext = (() => {
    const isWeekday = todayIdx >= 0 && todayIdx <= 4;
    if (isWeekday) {
      const sc = getDaySchedule(todayIdx, tt, DAYS);
      const nx = sc.find(b => b.start > nowMins && b.type !== "lunch");
      if (nx) return { block: nx, tomorrow: false };
    }
    // No more classes today or weekend: find next weekday with classes
    const startIdx = isWeekday ? (todayIdx + 1) % 5 : 0; // Mon if weekend
    for (let i = 0; i < 5; i++) {
      const ni = (startIdx + i) % 5;
      const ns = getDaySchedule(ni, tt, DAYS);
      const n = ns.find(b => b.type !== "lunch");
      if (n) return { block: n, tomorrow: true };
    }
    return null;
  })();

  const nextClassId = upNext && !upNext.tomorrow ? upNext.block.id : null;

  const ch = now.getHours(), cm = now.getMinutes().toString().padStart(2, "0");
  const cap = ch >= 12 ? "PM" : "AM", ch12 = ch > 12 ? ch - 12 : ch || 12;

  const openEdit = (block, dayName, sessionStart) => { setSel({ ...block, dayName, sessionStart }); dlg.current?.showModal(); };
  const saveEdit = (e) => {
    e.preventDefault();
    const nt = new FormData(e.target).get("text");
    setTt(prev => prev.map(r => toMinutes(r.start) === sel.sessionStart ? { ...r, days: { ...r.days, [sel.dayName]: nt } } : r));
    dlg.current?.close();
  };

  /* schedule editor */
  const openSchedEditor = () => { setSchedOpen(true); schedDlg.current?.showModal(); };
  const closeSchedEditor = () => { setSchedOpen(false); schedDlg.current?.close(); };
  const saveSchedCell = (si, dayName, val) => {
    setTt(prev => prev.map((r, i) => i === si ? { ...r, days: { ...r.days, [dayName]: val } } : r));
  };

  /* color manager */
  const updateColor   = (key, hex) => setColors(prev => ({ ...prev, [key]: hex }));
  const deleteColor   = (key) => setColors(prev => { const n = { ...prev }; delete n[key]; return n; });
  const addColor = () => {
    const k = newColorName.trim();
    if (!k) return;
    setColors(prev => ({ ...prev, [k]: newColorHex }));
    setNewColorName("");
    setNewColorHex("#4f63f8");
  };

  return (
    <div className="app">
      {/* ── MAIN ─────────────────────────────────────── */}
      <div className="main-wrap">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-brand">
            <div className="brand-icon"><LayoutGrid size={14}/></div>
            <span className="brand-name">Timetable</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-clock">{ch12}:{cm} <span className="topbar-ap">{cap}</span></span>
            <button className={`tbtn ${theme === "light" ? "tbtn-on" : ""}`} onClick={() => setTheme("light")} title="Light"><Sun size={13}/></button>
            <button className={`tbtn ${theme === "system" ? "tbtn-on" : ""}`} onClick={() => setTheme("system")} title="System"><Monitor size={13}/></button>
            <button className={`tbtn ${theme === "dark" ? "tbtn-on" : ""}`} onClick={() => setTheme("dark")} title="Dark"><Moon size={13}/></button>
          </div>
        </header>

        <main className="main-content">
          {/* Greeting */}
          <div className="greeting-row">
            <div>
              <h1 className="greeting">{greet(now.getHours())}, {STUDENT_NAME}</h1>
              <p className="greeting-date">{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
            </div>
            <button className="edit-btn" onClick={openSchedEditor}><PencilLine size={13}/> Edit Schedule</button>
          </div>

          {/* Now Panel */}
          <AnimatePresence mode="wait">
            <motion.div key={nowState.type} initial={{opacity:0}} animate={{opacity:1}} className="now-panel">
              <div className="now-left">
                {nowState.type === "after" || nowState.type === "weekend" ? <>
                  <p className="now-label">DONE FOR TODAY</p>
                  <h2 className="now-main">That's a wrap</h2>
                  {nowState.type === "weekend"
                    ? <p className="now-sub">No classes scheduled today. Enjoy your day off!</p>
                    : <p className="now-sub">{todayStats.cls} classes, {fmtMins(todayStats.mins)} of teaching. All done for {todayDayName}!</p>}
                </> : nowState.type === "active" ? <>
                  <p className="now-label">NOW IN SESSION</p>
                  <h2 className="now-main">{nowState.current.text.split(" ")[0]}</h2>
                  <div className="now-chip"><Clock size={11}/>{nowState.remaining} min left</div>
                </> : nowState.type === "passing" ? <>
                  <p className="now-label">PASSING PERIOD</p>
                  <h2 className="now-main">Break</h2>
                  <div className="now-chip"><ArrowRight size={11}/>Next in {nowState.remaining} min</div>
                </> : <>
                  <p className="now-label">UPCOMING</p>
                  <h2 className="now-main">Day starts soon</h2>
                  <div className="now-chip"><Clock size={11}/>First class in {nowState.remaining} min</div>
                </>}
              </div>
              <div className="now-divider"/>
              <div className="now-right">
                <p className="now-label"><ArrowRight size={10}/>UP NEXT</p>
                {upNext ? <>
                  <p className="now-next-name">{upNext.block.text.split(" ")[0]}</p>
                  {upNext.tomorrow
                    ? <p className="now-tomorrow">📅 Tomorrow · {fmt12(upNext.block.start)}</p>
                    : <div className="now-next-chip" style={{borderColor:subjectColor(upNext.block.text)+"55",background:subjectColor(upNext.block.text)+"18"}}>
                        <div className="now-dot" style={{background:subjectColor(upNext.block.text)}}/>
                        <span style={{color:subjectColor(upNext.block.text)}}>{upNext.block.text.split(" ").slice(1).join(" ")}</span>
                        <span className="now-time">{fmt12(upNext.block.start)} — {fmt12(upNext.block.end)}</span>
                      </div>}
                </> : <p className="now-sub">No upcoming classes</p>}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* At a Glance — always uses REAL today, not the browsed date */}
          <div>
            <p className="section-lbl">{todayDayName.toUpperCase()} AT A GLANCE</p>
            <div className="stats-grid">
              {[
                {icon:<BookOpen size={11}/>, lbl:"CLASSES",    val: todayIdx >= 0 && todayIdx <= 4 ? todayStats.cls : "—"},
                {icon:<Clock size={11}/>,    lbl:"CLASS TIME", val: todayIdx >= 0 && todayIdx <= 4 && todayStats.mins > 0 ? fmtMins(todayStats.mins) : "—"},
                {icon:<CircleDot size={11}/>, lbl:"FREE",      val: todayIdx >= 0 && todayIdx <= 4 ? (todayStats.free > 0 ? `${todayStats.free} slot${todayStats.free > 1 ? "s" : ""}` : "None") : "—"},
                {icon:<Utensils size={11}/>, lbl:"LUNCH",      val: todayIdx >= 0 && todayIdx <= 4 ? (todayStats.lunch || "—") : "—"},
              ].map(s => (
                <div key={s.lbl} className="stat-card">
                  <div className="stat-icon">{s.icon}</div>
                  <p className="stat-lbl">{s.lbl}</p>
                  <p className="stat-val">{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Timetable */}
          <div className="tt-wrap">
            {/* Controls */}
            <div className="tt-controls">
              <p className="section-lbl">TIMETABLE</p>
              <div className="view-toggle">
                <button className={`vbtn ${view === "week" ? "vbtn-on" : ""}`} onClick={() => setView("week")}><span>⊞</span> Week</button>
                <button className={`vbtn ${view === "day" ? "vbtn-on" : ""}`} onClick={() => setView("day")}><AlignJustify size={11}/> Day</button>
              </div>
            </div>

            {/* Month + Day strip */}
            <div className="strip-month-label">{stripMonth}</div>
            <div className="day-strip">
              <button className="dnav" onClick={() => { setWeekOffset(p => p - 1); setView("week"); }}><ChevronLeft size={12}/></button>
              {DAYS.map((day, i) => {
                const d = weekDates[i], isA = i === dayIdx;
                const isT = (() => {
                  const real = new Date();
                  return weekOffset === 0 && real.getDay() - 1 === i;
                })();
                return (
                  <button key={day} className={`dpill ${isA ? "dpill-a" : ""}`} onClick={() => { setDayIdx(i); setView("day"); }}>
                    <span className="dpill-name">{day.substring(0,3).toUpperCase()}</span>
                    <span className={`dpill-num ${isT ? "dpill-today" : ""}`}>{d.getDate()}</span>
                  </button>
                );
              })}
              <button className="dnav" onClick={() => { setWeekOffset(p => p + 1); setView("week"); }}><ChevronRight size={12}/></button>
              <button className="today-btn" onClick={() => { const d = new Date().getDay()-1; if(d>=0&&d<=4){ setDayIdx(d); setView("day"); } setWeekOffset(0); }}>⊙ Today</button>
            </div>

            {/* Grid */}
            <div className="grid-outer">
              {/* Col headers */}
              <div className="col-headers">
                <div className="time-col"/>
                {DAYS.map((day, i) => {
                  if (view === "day" && i !== dayIdx) return null;
                  const isT = weekOffset === 0 && new Date().getDay() - 1 === i;
                  return (
                    <div key={day} className={`col-hdr ${isT ? "col-hdr-today" : ""}`}>
                      <span className="col-hdr-name">{day.substring(0,3).toUpperCase()}</span>
                      <span className={`col-hdr-num ${isT ? "col-hdr-num-t" : ""}`}>{weekDates[i].getDate()}</span>
                      {isT && <div className="col-bar"/>}
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              <div className="grid-body">
                {tt.map((session) => {
                  const slotStart = toMinutes(session.start);
                  const slotEnd   = toMinutes(session.end);
                  return (
                    <div key={session.start} className="grid-row">
                      <div className="time-col">
                        <span className="time-lbl">{session.start}</span>
                      </div>
                      {DAYS.map((dayName, di) => {
                        if (view === "day" && di !== dayIdx) return null;
                        const text   = session.days[dayName];
                        const isDone = weekOffset === 0 && todayIdx === di && slotEnd <= nowMins;
                        const isNext = weekOffset === 0 && todayIdx === di && `${dayName}-${session.start}` === nextClassId;
                        const isFree   = text === "";
                        const isLunch  = text === "Lunch";
                        const col = subjectColor(text);

                        if (isFree) return (
                          <div key={dayName} className="grid-cell">
                            <div className="cell-free cell-clickable"
                              onClick={() => openEdit({start:slotStart,end:slotEnd,text:"",type:"class",id:`${dayName}-${session.start}`}, dayName, slotStart)}>
                              <span className="free-icon">⊙</span>
                              <span className="free-text">Free</span>
                            </div>
                          </div>
                        );
                        if (isLunch) return (
                          <div key={dayName} className="grid-cell">
                            <div className="cell-lunch cell-clickable"
                              onClick={() => openEdit({start:slotStart,end:slotEnd,text:"Lunch",type:"lunch",id:`${dayName}-${session.start}`}, dayName, slotStart)}>
                              <Utensils size={12} style={{opacity:0.5}}/>
                              <span>Lunch</span>
                            </div>
                          </div>
                        );
                        if (!text) return <div key={dayName} className="grid-cell grid-cell-empty"/>;
                        return (
                          <div key={dayName} className="grid-cell">
                            <div
                              className={`block-card ${isDone ? "block-done" : ""} ${isNext ? "block-next" : ""}`}
                              style={{
                                borderLeftColor: col,
                                background: isNext ? undefined : col + "18",
                                borderTopColor: col + "30",
                                borderRightColor: col + "30",
                                borderBottomColor: col + "30",
                              }}
                              onClick={() => openEdit({start:slotStart,end:slotEnd,text,type:"class",id:`${dayName}-${session.start}`}, dayName, slotStart)}
                            >
                              <div className="block-top">
                                <div>
                                  <p className="block-subj">{text.split(" ")[0]}</p>
                                  <p className="block-room">{text.split(" ").slice(1).join(" ")}</p>
                                </div>
                                {isDone && <span className="block-check">✓</span>}
                                {isNext && <span className="block-next-badge">NEXT</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Shortcuts */}
          <footer className="shortcuts">
            <span className="sc-item"><kbd>⊟</kbd> Shortcuts</span>
            <span className="sc-item"><kbd>←</kbd><kbd>→</kbd> change day</span>
            <span className="sc-item"><kbd>T</kbd> today</span>
            <span className="sc-item"><kbd>W</kbd><kbd>D</kbd> week or day</span>
            <span className="sc-item"><kbd>Esc</kbd> close details</span>
          </footer>
        </main>
      </div>

      {/* Edit dialog */}
      <dialog ref={dlg} className="edit-dialog">
        {sel && (() => {
          const colorKey = Object.keys(colors).find(k => sel.text?.startsWith(k)) || sel.text?.split(" ")[0] || "";
          const currentColor = colors[colorKey] || "#94a3b8";
          return (
            <div className="edit-box">
              <h2>Edit Session</h2>
              <form onSubmit={saveEdit}>
                <label>Class / Text</label>
                <input name="text" defaultValue={sel.text} key={sel.id}/>

                {/* ── Inline color picker ── */}
                <label style={{marginTop:"10px"}}>Subject Color</label>
                <div className="edit-color-row">
                  <div className="color-swatch-wrap edit-swatch">
                    <input
                      type="color"
                      className="color-picker"
                      value={currentColor}
                      onChange={e => updateColor(colorKey, e.target.value)}
                      title={`Color for "${colorKey}"`}
                    />
                    <span className="color-dot edit-dot" style={{ background: currentColor }}/>
                  </div>
                  <div className="edit-color-info">
                    <div className="edit-color-top">
                      <span className="edit-color-key">{colorKey}</span>
                      <span className="edit-color-hex">{currentColor}</span>
                    </div>
                    <span className="edit-color-hint">Applies to all {colorKey} blocks instantly</span>
                  </div>
                </div>

                <div className="edit-actions">
                  <button type="button" onClick={() => dlg.current?.close()} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn-save">Save</button>
                </div>
              </form>
            </div>
          );
        })()}
      </dialog>

      {/* ── SCHEDULE EDITOR DIALOG ────────────────────── */}
      <dialog ref={schedDlg} className="sched-dialog">
        <div className="sched-box">
          <div className="sched-header">
            <div>
              <h2 className="sched-title">Edit Schedule</h2>
              <p className="sched-sub">Click any cell to edit its subject &amp; room</p>
            </div>
            <button className="sched-close" onClick={closeSchedEditor}>✕</button>
          </div>

          <div className="sched-table-wrap">
            <table className="sched-table">
              <thead>
                <tr>
                  <th className="sched-th sched-time-th">Time</th>
                  {DAYS.map(d => <th key={d} className="sched-th">{d.slice(0,3).toUpperCase()}</th>)}
                </tr>
              </thead>
              <tbody>
                {tt.map((session, si) => (
                  <tr key={session.start} className="sched-tr">
                    <td className="sched-td sched-time-td">{session.start}</td>
                    {DAYS.map(dayName => {
                      const val = session.days[dayName] ?? "";
                      const isEditing = schedEdit?.si === si && schedEdit?.dayName === dayName;
                      return (
                        <td key={dayName} className="sched-td">
                          {isEditing ? (
                            <input
                              className="sched-cell-input"
                              autoFocus
                              defaultValue={val}
                              onBlur={e => { saveSchedCell(si, dayName, e.target.value); setSchedEdit(null); }}
                              onKeyDown={e => {
                                if (e.key === "Enter") { saveSchedCell(si, dayName, e.target.value); setSchedEdit(null); }
                                if (e.key === "Escape") setSchedEdit(null);
                              }}
                            />
                          ) : (
                            <div
                              className={`sched-cell ${!val ? "sched-cell-empty" : val === "Lunch" ? "sched-cell-lunch" : ""}`}
                              style={val && val !== "Lunch" ? { borderLeft: `3px solid ${subjectColor(val)}` } : {}}
                              onClick={() => setSchedEdit({ si, dayName })}
                            >
                              {val || <span className="sched-empty-lbl">—</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Subject Colors Section ─────────────────── */}
          <div className="sched-colors-section">
            <div className="sched-colors-header">
              <span className="sched-colors-title">Subject Colors</span>
              <span className="sched-colors-hint">Color is matched by subject name prefix</span>
            </div>

            <div className="sched-colors-grid">
              {Object.entries(colors).map(([key, hex]) => (
                <div key={key} className="color-row">
                  <div className="color-swatch-wrap">
                    <input
                      type="color"
                      className="color-picker"
                      value={hex}
                      onChange={e => updateColor(key, e.target.value)}
                      title={`Pick color for ${key}`}
                    />
                    <span className="color-dot" style={{ background: hex }}/>
                  </div>
                  <span className="color-key">{key}</span>
                  <span className="color-hex">{hex}</span>
                  <button className="color-del-btn" onClick={() => deleteColor(key)} title="Remove">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add new color */}
            <div className="color-add-row">
              <input
                className="sched-cell-input color-add-name"
                placeholder="Subject prefix (e.g. ML)"
                value={newColorName}
                onChange={e => setNewColorName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addColor()}
              />
              <div className="color-swatch-wrap">
                <input
                  type="color"
                  className="color-picker"
                  value={newColorHex}
                  onChange={e => setNewColorHex(e.target.value)}
                  title="Pick new color"
                />
                <span className="color-dot" style={{ background: newColorHex }}/>
              </div>
              <button className="btn-save color-add-btn" onClick={addColor}>+ Add</button>
            </div>
          </div>

          <div className="sched-footer">
            <button className="btn-cancel" onClick={closeSchedEditor}>Close</button>
            <button className="btn-save" onClick={closeSchedEditor}>Done</button>
          </div>
        </div>
      </dialog>

      <Analytics/>
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, LayoutGrid, AlignJustify,
  Sun, Moon, Monitor, Utensils, ArrowRight, CircleDot,
  BookOpen, Clock, Search, Plus, PencilLine, Trash2, Check,
} from "lucide-react";
import "./App.css";
import { DAYS, SESSIONS as DEFAULT_SESSIONS, STUDENT_NAME } from "./data/timetable.js";
import { toMinutes, getCurrentTimeMinutes } from "./lib/time.js";
import { getNowState, getDaySchedule } from "./lib/schedule.js";

/* ─── helpers ─────────────────────────────────────────────────── */
const greet = (h) => h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
const fmtMins = (t) => { const h = Math.floor(t/60), m = t%60; return m ? `${h}h ${m}m` : `${h}h`; };
const fmt12 = (m) => { const h=Math.floor(m/60), mm=m%60, hh=h>12?h-12:h||12, ap=h>=12?"PM":"AM"; return `${hh}:${mm.toString().padStart(2,"0")} ${ap}`; };

const COLORS = {
  WebDev:"#f9a8d4", Nand:"#f87171", ML:"#a78bfa", DBMS:"#4ade80",
  DSA:"#fbbf24", Coding:"#22d3ee", Community:"#c084fc", Verbal:"#fb923c",
};
const subjectColor = (t) => { const k=Object.keys(COLORS).find(k=>t?.startsWith(k)); return k?COLORS[k]:"#94a3b8"; };

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
  tt.forEach(r=>{ const t=r.days[name];
    if(t===undefined) return;
    if(!t){free++;return;} if(t==="Lunch"){lunch=r.start;return;}
    cls++; mins+=toMinutes(r.end)-toMinutes(r.start);
  });
  return {cls,mins,lunch,free};
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
  const [now, setNow]         = useState(new Date());
  const [tt, setTt]           = useState(DEFAULT_SESSIONS);
  const [view, setView]       = useState("week");
  const [dayIdx, setDayIdx]   = useState(() => { const d = new Date().getDay() - 1; return d >= 0 && d <= 4 ? d : 0; });
  const [weekOffset, setWeekOffset] = useState(0);
  const [theme, setTheme]     = useState(() => localStorage.getItem("tt_theme") || "dark");
  const [calY, setCalY]       = useState(new Date().getFullYear());
  const [calM, setCalM]       = useState(new Date().getMonth());
  const [sel, setSel]         = useState(null);
  const [todos, setTodos]     = useState(() => { try { return JSON.parse(localStorage.getItem("tt_todos") || "[]"); } catch { return []; } });
  const [todoInput, setTodoInput] = useState("");
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedEdit, setSchedEdit] = useState(null); // {si, dayName}
  const dlg = useRef(null);
  const schedDlg = useRef(null);

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

  /* persist */
  useEffect(() => { const s = localStorage.getItem("smartTimetable"); if (s) { try { setTt(JSON.parse(s)); } catch {} } }, []);
  useEffect(() => { localStorage.setItem("smartTimetable", JSON.stringify(tt)); }, [tt]);
  useEffect(() => { localStorage.setItem("tt_todos", JSON.stringify(todos)); }, [todos]);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

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
  const todayIdx  = now.getDay() - 1;
  const nowMins   = getCurrentTimeMinutes(now);
  const nowState  = getNowState(nowMins, todayIdx, tt, DAYS);
  const weekDates = getWeekDates(weekOffset);
  const stats     = getDayStats(dayIdx, tt);
  const calDays   = buildCal(calY, calM);

  /* month label for the day strip */
  const stripMonth = (() => {
    const first = weekDates[0], last = weekDates[4];
    if (first.getMonth() === last.getMonth())
      return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
    return `${MONTH_NAMES[first.getMonth()].slice(0,3)} – ${MONTH_NAMES[last.getMonth()].slice(0,3)} ${last.getFullYear()}`;
  })();

  /* up next */
  const upNext = (() => {
    const idx = todayIdx >= 0 && todayIdx <= 4 ? todayIdx : dayIdx;
    const sc = getDaySchedule(idx, tt, DAYS);
    const nx = sc.find(b => b.start > nowMins && b.type !== "lunch");
    if (nx) return { block: nx, tomorrow: false };
    const ti = (idx + 1) % 5, ts = getDaySchedule(ti, tt, DAYS);
    const n = ts.find(b => b.type !== "lunch");
    return n ? { block: n, tomorrow: true } : null;
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

  /* calendar click: jump to that week + day */
  const handleCalDayClick = (day) => {
    if (!day) return;
    const clicked = new Date(calY, calM, day);
    const dow = clicked.getDay();
    if (dow === 0 || dow === 6) return; // weekend
    const today = new Date();
    today.setHours(0,0,0,0);
    clicked.setHours(0,0,0,0);
    const diffDays = Math.round((clicked - today) / 86400000);
    const newOffset = Math.floor(diffDays / 7 + (diffDays < 0 && diffDays % 7 !== 0 ? 0 : 0));
    // compute week offset properly
    const todayMon = new Date(today);
    const todayDow = today.getDay();
    todayMon.setDate(today.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
    const clickedMon = new Date(clicked);
    const clickedDow = clicked.getDay();
    clickedMon.setDate(clicked.getDate() - (clickedDow === 0 ? 6 : clickedDow - 1));
    const weekDiff = Math.round((clickedMon - todayMon) / (7 * 86400000));
    setWeekOffset(weekDiff);
    setDayIdx(dow - 1);
  };

  /* todo helpers */
  const doAddTodo = () => {
    if (!todoInput.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: todoInput.trim(), done: false }]);
    setTodoInput("");
  };
  const addTodo = (e) => { e.preventDefault(); doAddTodo(); };
  const toggleTodo = (id) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id) => setTodos(prev => prev.filter(t => t.id !== id));

  return (
    <div className="app">
      {/* ── SIDEBAR ──────────────────────────────────── */}
      <aside className="sidebar">
        {/* Mini Calendar */}
        <div className="cal-header">
          <span className="cal-title">{MONTH_NAMES[calM]} {calY}</span>
          <div className="cal-nav">
            <button onClick={() => { const d = new Date(calY, calM - 1, 1); setCalM(d.getMonth()); setCalY(d.getFullYear()); }}><ChevronLeft size={13}/></button>
            <button onClick={() => { const d = new Date(calY, calM + 1, 1); setCalM(d.getMonth()); setCalY(d.getFullYear()); }}><ChevronRight size={13}/></button>
          </div>
        </div>
        <div className="cal-grid">
          {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
          {calDays.map((d, i) => {
            const td = new Date();
            const isToday = d && calY === td.getFullYear() && calM === td.getMonth() && d === td.getDate();
            const isSelected = (() => {
              if (!d) return false;
              const wd = weekDates[dayIdx];
              return calY === wd.getFullYear() && calM === wd.getMonth() && d === wd.getDate();
            })();
            const clicked = d ? new Date(calY, calM, d) : null;
            const dow = clicked?.getDay();
            const isWeekend = dow === 0 || dow === 6;
            return (
              <div
                key={i}
                className={`cal-day ${d ? "cal-day-valid" : ""} ${isToday ? "cal-day-today" : ""} ${isSelected && !isToday ? "cal-day-selected" : ""} ${isWeekend && d ? "cal-day-weekend" : ""}`}
                onClick={() => handleCalDayClick(d)}
              >
                {d || ""}
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="sb-search">
          <Search size={13} className="sb-search-icon"/>
          <input placeholder="Find calendar or room"/>
        </div>

        {/* My Calendars */}
        <div className="sb-section">
          <p className="sb-section-title">MY CALENDARS</p>
          <div className="cal-legend">
            <div className="cal-legend-item"><span className="cal-dot" style={{background:"#4f63f8"}}/> Timetable</div>
            <div className="cal-legend-item"><span className="cal-dot" style={{background:"#4ade80"}}/> Free Slots</div>
            <div className="cal-legend-item"><span className="cal-dot" style={{background:"#fbbf24"}}/> Exams</div>
          </div>
        </div>

        {/* Todo List */}
        <div className="sb-section todo-section">
          <p className="sb-section-title">TODO LIST</p>
          <form className="todo-form" onSubmit={addTodo}>
            <input
              className="todo-input"
              value={todoInput}
              onChange={e => setTodoInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); doAddTodo(); } }}
              placeholder="Add a task…"
            />
            <button
              type="button"
              className="todo-add-btn"
              onClick={e => { e.stopPropagation(); doAddTodo(); }}
            ><Plus size={13}/></button>
          </form>
          <ul className="todo-list">
            <AnimatePresence>
              {todos.length === 0 && (
                <li className="todo-empty">No tasks yet. Add one above!</li>
              )}
              {todos.map(t => (
                <motion.li
                  key={t.id}
                  className={`todo-item ${t.done ? "todo-done" : ""}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  <button className="todo-check" onClick={() => toggleTodo(t.id)}>
                    {t.done ? <Check size={10}/> : null}
                  </button>
                  <span className="todo-text">{t.text}</span>
                  <button className="todo-del" onClick={() => deleteTodo(t.id)}><Trash2 size={10}/></button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </aside>

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
                  <p className="now-sub">{stats.cls} classes, {fmtMins(stats.mins)} of teaching. Nothing left on {DAYS[dayIdx]}.</p>
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
                <p className="now-label"><ArrowRight size={10} style={{display:"inline",marginRight:3}}/>UP NEXT</p>
                {upNext ? <>
                  <p className="now-next-name">{upNext.block.text.split(" ")[0]}</p>
                  {upNext.tomorrow
                    ? <p className="now-tomorrow">Tomorrow at {fmt12(upNext.block.start)}</p>
                    : <div className="now-next-chip" style={{borderColor:subjectColor(upNext.block.text)+"55",background:subjectColor(upNext.block.text)+"18"}}>
                        <div className="now-dot" style={{background:subjectColor(upNext.block.text)}}/>
                        <span style={{color:subjectColor(upNext.block.text)}}>{upNext.block.text.split(" ").slice(1).join(" ")}</span>
                        <span className="now-time">{fmt12(upNext.block.start)} — {fmt12(upNext.block.end)}</span>
                      </div>}
                </> : <p className="now-sub">No upcoming classes</p>}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* At a Glance */}
          <div>
            <p className="section-lbl">{DAYS[dayIdx]?.toUpperCase()} AT A GLANCE</p>
            <div className="stats-grid">
              {[
                {icon:<BookOpen size={11}/>, lbl:"CLASSES",    val:stats.cls},
                {icon:<Clock size={11}/>,    lbl:"CLASS TIME", val:fmtMins(stats.mins)},
                {icon:<CircleDot size={11}/>, lbl:"FREE", val:stats.free>0?`${stats.free} slot${stats.free>1?"s":""}` :"None"},
                {icon:<Utensils size={11}/>, lbl:"LUNCH",      val:stats.lunch||"—"},
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
                            <div className="cell-free">
                              <span className="free-icon">⊙</span>
                              <span className="free-text">Free</span>
                            </div>
                          </div>
                        );
                        if (isLunch) return (
                          <div key={dayName} className="grid-cell">
                            <div className="cell-lunch">
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
                              style={{borderLeftColor: col}}
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
        {sel && (
          <div className="edit-box">
            <h2>Edit Session</h2>
            <form onSubmit={saveEdit}>
              <label>Class / Text</label>
              <input name="text" defaultValue={sel.text} key={sel.id}/>
              <div className="edit-actions">
                <button type="button" onClick={() => dlg.current?.close()} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save">Save</button>
              </div>
            </form>
          </div>
        )}
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
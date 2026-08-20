# Timetable

A live weekly class timetable for a B.Tech schedule. It answers one question first — where do I need to be right now? — and keeps the full week available underneath.

The current class, the countdown, the now-state panel and the "up next" chip all track the system clock and update on their own. Nothing is hardcoded to a day or a time, and nothing needs a refresh.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # the schedule engine
npm run build
```

## Editing the timetable

Everything lives in `src/data/timetable.js`. Sessions are declared as a matrix of time slots × weekdays:

```js
{ start: "09:10", end: "10:00", days: {
    Monday: "WebDev B-220",
    Tuesday: "Nand B-220",
    Wednesday: "WebDev B-205",
    Thursday: "Nand B-220",
    Friday: "Coding B-220",
  }
}
```

Each cell value is `"SubjectCode Room"` — subject name first, room number after the space. Leave a cell as `""` for a free period and write `"Lunch"` for the lunch break. The schedule engine parses these automatically; there is no second place to update.

Subjects and their accent colours are declared in `App.jsx`:

```js
const COLORS = {
  WebDev: "#f9a8d4", Nand: "#f87171", ML: "#a78bfa",
  DBMS: "#4ade80",   DSA: "#fbbf24", Coding: "#22d3ee",
  Community: "#c084fc", Verbal: "#fb923c",
};
```

Adding a new subject means adding one line here and one entry in `SUBJECTS` in `timetable.js`.

Your name for the greeting is `STUDENT_NAME` at the top of the same file.

## How it fits together

```
src/
  data/timetable.js    the schedule matrix and subject list — the only data
  lib/time.js          toMinutes(), formatTime(), getCurrentTimeMinutes()
  lib/schedule.js      getDaySchedule(), getTimelineBounds(), getNowState()
  lib/schedule.test.js unit tests for the schedule engine
  App.jsx              single-file app: state, layout, all components inline
  App.css              glassmorphic design system, dark/light tokens
  index.css            base reset and root variables
```

Time is always **minutes since local midnight**. The only bridge to the real world is `Date`'s local getters, so the app is timezone-correct by construction and has nothing to go wrong across daylight saving. Days are indexed from `getDay()` (0 = Sunday) and mapped to Monday–Friday, so it does not break under a non-English locale.

A block owns `[start, end)`. At exactly 10:00 the 09:10 class is over and the 10:05 slot has begun. The gap between 10:00 and 10:05 is a **passing period** — `getNowState` returns `{ type: "passing" }` for those five minutes.

The clock (`setInterval` every 30 s) drives a single `now` state at the top of the component tree. All derived values — `nowState`, `upNext`, `stats` — are recomputed synchronously from that one timestamp so the UI is always consistent.

## Now panel states

| State | Condition |
|-------|-----------|
| `before` | Before the first slot of the day |
| `active` | Inside a class or lunch block |
| `passing` | In the gap between two blocks |
| `after` | Past the last slot |
| `weekend` | Saturday or Sunday |

## Testing the clock

```bash
npm test
```

Runs `src/lib/schedule.test.js` with Node's built-in test runner against every state the engine can produce — including every passing period and the edge case where a gap opens onto a free slot rather than a class.

## Features

- **Live now panel** — shows current class, passing period countdown, or end-of-day message
- **Up next chip** — nearest upcoming class with room and time; falls through to tomorrow if today is done
- **Week & Day views** — toggle with buttons or `W` / `D` keys
- **Day strip** — click any day pill to jump to it; today is highlighted
- **Mini calendar in sidebar** — click any weekday to jump to that week and day
- **Day stats** — classes, total teaching time, free slots, and lunch time at a glance
- **Inline cell editing** — click any timetable block to edit subject and room; persisted to `localStorage`
- **Full schedule editor** — spreadsheet-style dialog to edit the entire matrix at once
- **Todo list** — add, complete, and delete tasks; persisted to `localStorage`
- **Light / Dark / System theme** — persisted across sessions
- **Keyboard navigation** — `←` `→` change day, `T` today, `W` week view, `D` day view, `Esc` close dialogs

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Previous / next day |
| `T` | Jump to today |
| `W` | Switch to week view |
| `D` | Switch to day view |
| `Esc` | Close open dialog |

## Stack

React 19, Vite 8, Tailwind CSS v4, Framer Motion, Lucide React, Vercel Analytics.  
No component library, no date library. The schedule engine is plain functions with no dependencies.

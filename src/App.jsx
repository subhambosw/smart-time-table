import React, { useState, useEffect } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIMETABLE_DATA = [
  {
    time: "9:10-10:00",
    start: "09:10",
    end: "10:00",
    days: {
      Monday: { text: "WebDev B-220", type: "class" },
      Tuesday: { text: "Nand B-220", type: "class" },
      Wednesday: { text: "WebDev B-205", type: "class" },
      Thursday: { text: "Nand B-220", type: "class" },
      Friday: { text: "Coding B-220", type: "class" },
    },
  },
  {
    time: "10:05-10:55",
    start: "10:05",
    end: "10:55",
    days: {
      Monday: { text: "ML  B-220", type: "class" },
      Tuesday: { text: "ML  B-209", type: "class" },
      Wednesday: { text: "Community B-222", type: "class" },
      Thursday: { text: "Nand B-220", type: "class" },
      Friday: { text: "Coding B-220", type: "class" },
    },
  },
  {
    time: "11:00-11:50",
    start: "11:00",
    end: "11:50",
    days: {
      Monday: { text: "WebDev B-318", type: "class" },
      Tuesday: { text: "", type: "empty" },
      Wednesday: { text: "Nand B-220", type: "class" },
      Thursday: { text: "DBMS B-517", type: "class" },
      Friday: { text: "DBMS B-220", type: "class" },
    },
  },
  {
    time: "11:50-12:40",
    start: "11:50",
    end: "12:40",
    days: {
      Monday: { text: "WebDev B-318", type: "class" },
      Tuesday: { text: "DSA B-018", type: "class" },
      Wednesday: { text: "Lunch", type: "lunch" },
      Thursday: { text: "DBMS B-517", type: "class" },
      Friday: { text: "Lunch", type: "lunch" },
    },
  },
  {
    time: "12:40-1:30",
    start: "12:40",
    end: "13:30",
    days: {
      Monday: { text: "Lunch", type: "lunch" },
      Tuesday: { text: "Lunch", type: "lunch" },
      Wednesday: { text: "DSA B-220", type: "class" },
      Thursday: { text: "Lunch", type: "lunch" },
      Friday: { text: "ML  B-220", type: "class" },
    },
  },
  {
    time: "1:30-2:20",
    start: "13:30",
    end: "14:20",
    days: {
      Monday: { text: "Verbal B-220", type: "class" },
      Tuesday: { text: "", type: "empty" },
      Wednesday: { text: "ML  B-116", type: "class" },
      Thursday: { text: "DBMS B-220", type: "class" },
      Friday: { text: "ML  B-220", type: "class" },
    },
  },
  {
    time: "2:20-3:10",
    start: "14:20",
    end: "15:10",
    days: {
      Monday: { text: "DSA B-517", type: "class" },
      Tuesday: { text: "DBMS B-220", type: "class" },
      Wednesday: { text: "Coding B-220", type: "class" },
      Thursday: { text: "", type: "empty" },
      Friday: { text: "WebDev B-220", type: "class" },
    },
  },
  {
    time: "3:10-4:00",
    start: "15:10",
    end: "16:00",
    days: {
      Monday: { text: "DSA B-517", type: "class" },
      Tuesday: { text: "Verbal B-208", type: "class" },
      Wednesday: { text: "Coding B-220", type: "class" },
      Thursday: { text: "DSA B-220", type: "class" },
      Friday: { text: "Nand B-220", type: "class" },
    },
  },
];

// Background color per cell type — matches the screenshot's palette.
const TYPE_STYLES = {
  class: "bg-blue-100",
  lunch: "bg-neutral-300",
  empty: "bg-green-200",
};

// "HH:MM" -> minutes since midnight, for easy numeric comparison.
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Figures out which (day, row) is "now", based on the real system clock.
 * Returns { day, time } of the active row, or null if nothing is active
 * (weekend, or outside 9:10–4:00).
 */
function getActiveSlot(now) {
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  if (!DAYS.includes(dayName)) return null; // weekend

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const activeRow = TIMETABLE_DATA.find(
    (row) => nowMinutes >= toMinutes(row.start) && nowMinutes < toMinutes(row.end)
  );
  if (!activeRow) return null; // outside 9:10–4:00, or in an unlisted gap

  return { day: dayName, time: activeRow.time };
}

function Cell({ entry, isActive }) {
  return (
    <td
      className={`border px-2 py-3 text-center align-middle text-sm sm:text-base transition-colors ${
        TYPE_STYLES[entry.type]
      } ${isActive ? "border-4 border-red-600 relative z-10" : "border-black"}`}
    >
      {entry.text}
    </td>
  );
}

export default function Timetable() {
  const [now, setNow] = useState(new Date());

  // Re-check the clock every 30s — plenty granular for a class schedule,
  // no need to re-render every second.
  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(intervalId);
  }, []);

  const activeSlot = getActiveSlot(now);

  return (
    <div className="w-full overflow-x-auto p-4">
      <table className="min-w-[800px] w-full border-collapse border-2 border-black">
        <thead>
          <tr>
            <th
              colSpan={DAYS.length + 1}
              className="border border-black bg-blue-100 px-2 py-3 text-xl sm:text-2xl font-semibold"
            >
              Time Table
            </th>
          </tr>
          <tr>
            <th className="border border-black bg-blue-100 px-2 py-3 text-base sm:text-lg font-semibold w-32">
              Time
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="border border-black bg-blue-100 px-2 py-3 text-base sm:text-lg font-semibold"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIMETABLE_DATA.map((row) => (
            <tr key={row.time}>
              <th className="border border-black bg-blue-100 px-2 py-3 text-base sm:text-lg font-semibold whitespace-nowrap">
                {row.time}
              </th>
              {DAYS.map((day) => (
                <Cell
                  key={day}
                  entry={row.days[day]}
                  isActive={
                    activeSlot !== null &&
                    activeSlot.day === day &&
                    activeSlot.time === row.time
                  }
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
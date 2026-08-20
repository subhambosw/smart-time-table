export const STUDENT_NAME = "Subham";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Our current subjects based on the grid
export const SUBJECTS = {
  "WebDev": { type: "class" },
  "Nand": { type: "class" },
  "ML": { type: "class" },
  "Community": { type: "class" },
  "DBMS": { type: "class" },
  "DSA": { type: "class" },
  "Verbal": { type: "class" },
  "Coding": { type: "class" },
  "Lunch": { type: "lunch" },
};

export const SESSIONS = [
  { start: "09:10", end: "10:00", days: { Monday: "WebDev B-220", Tuesday: "Nand B-220", Wednesday: "WebDev B-205", Thursday: "Nand B-220", Friday: "Coding B-220" } },
  { start: "10:05", end: "10:55", days: { Monday: "ML  B-220", Tuesday: "ML  B-209", Wednesday: "Community B-222", Thursday: "Nand B-220", Friday: "Coding B-220" } },
  { start: "11:00", end: "11:50", days: { Monday: "WebDev B-318", Tuesday: "", Wednesday: "Nand B-220", Thursday: "DBMS B-517", Friday: "DBMS B-220" } },
  { start: "11:50", end: "12:40", days: { Monday: "WebDev B-318", Tuesday: "DSA B-018", Wednesday: "Lunch", Thursday: "DBMS B-517", Friday: "Lunch" } },
  { start: "12:40", end: "13:30", days: { Monday: "Lunch", Tuesday: "Lunch", Wednesday: "DSA B-220", Thursday: "Lunch", Friday: "ML  B-220" } },
  { start: "13:30", end: "14:20", days: { Monday: "Verbal B-220", Tuesday: "", Wednesday: "ML  B-116", Thursday: "DBMS B-220", Friday: "ML  B-220" } },
  { start: "14:20", end: "15:10", days: { Monday: "DSA B-517", Tuesday: "DBMS B-220", Wednesday: "Coding B-220", Thursday: "", Friday: "WebDev B-220" } },
  { start: "15:10", end: "16:00", days: { Monday: "DSA B-517", Tuesday: "Verbal B-208", Wednesday: "Coding B-220", Thursday: "DSA B-220", Friday: "Nand B-220" } }
];

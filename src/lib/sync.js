/* ── JSONBin cross-device sync ──────────────────────────
   Bin ID  : set via VITE_JSONBIN_BIN_ID
   API Key : set via VITE_JSONBIN_KEY
   Shape stored in the bin:
     { timetable: [...], colors: { SubjectKey: "#hexcolor", ... } }
   ─────────────────────────────────────────────────────── */

const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
const KEY    = import.meta.env.VITE_JSONBIN_KEY;
const BASE   = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const HDR    = {
  "Content-Type": "application/json",
  "X-Master-Key": KEY,
};

/**
 * Fetch the shared timetable data from JSONBin.
 * Returns { timetable, colors } or null on failure.
 */
export async function loadCloud() {
  const r = await fetch(BASE, { headers: HDR });
  if (!r.ok) throw new Error(`JSONBin GET ${r.status}`);
  const j = await r.json();
  return j.record; // { timetable, colors }
}

/**
 * Write updated timetable + colors to JSONBin.
 * @param {{ timetable: object[], colors: object }} payload
 */
export async function saveCloud(payload) {
  const r = await fetch(BASE, {
    method: "PUT",
    headers: HDR,
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`JSONBin PUT ${r.status}`);
}

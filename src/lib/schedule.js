import { toMinutes } from './time.js';

/**
 * Returns a normalized schedule for a specific day index (0 = Monday, 4 = Friday).
 */
export function getDaySchedule(dayIndex, sessions, daysArray) {
  if (dayIndex < 0 || dayIndex > 4) return []; // Weekend
  const dayName = daysArray[dayIndex];
  
  const blocks = [];
  sessions.forEach(session => {
    const text = session.days[dayName];
    if (!text) return; // Skip empty blocks for this day
    
    blocks.push({
      start: toMinutes(session.start),
      end: toMinutes(session.end),
      text,
      type: text === 'Lunch' ? 'lunch' : 'class',
      id: `${dayName}-${session.start}`
    });
  });
  
  return blocks.sort((a, b) => a.start - b.start);
}

/**
 * Calculates the overall timeline boundaries across all days.
 */
export function getTimelineBounds(sessions) {
  let minTime = Number.MAX_VALUE;
  let maxTime = 0;
  
  sessions.forEach(session => {
    const s = toMinutes(session.start);
    const e = toMinutes(session.end);
    if (s < minTime) minTime = s;
    if (e > maxTime) maxTime = e;
  });
  
  return { start: minTime, end: maxTime, totalMinutes: maxTime - minTime };
}

/**
 * Pure function to determine the "now" state.
 */
export function getNowState(nowMinutes, dayIndex, sessions, daysArray) {
  const schedule = getDaySchedule(dayIndex, sessions, daysArray);
  
  if (schedule.length === 0) return { type: 'weekend' };
  
  const firstBlock = schedule[0];
  const lastBlock = schedule[schedule.length - 1];
  
  if (nowMinutes < firstBlock.start) {
    return { type: 'before', next: firstBlock, remaining: firstBlock.start - nowMinutes };
  }
  
  if (nowMinutes >= lastBlock.end) {
    return { type: 'after' };
  }
  
  for (let i = 0; i < schedule.length; i++) {
    const block = schedule[i];
    // Inside a block
    if (nowMinutes >= block.start && nowMinutes < block.end) {
      return { type: 'active', current: block, remaining: block.end - nowMinutes };
    }
    // In a gap (passing period)
    const nextBlock = schedule[i + 1];
    if (nextBlock && nowMinutes >= block.end && nowMinutes < nextBlock.start) {
      return { type: 'passing', next: nextBlock, remaining: nextBlock.start - nowMinutes };
    }
  }
  
  return { type: 'unknown' };
}

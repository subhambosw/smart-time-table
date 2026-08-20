import { test } from 'node:test';
import assert from 'node:assert';
import { getDaySchedule, getNowState, getTimelineBounds } from './schedule.js';
import { toMinutes } from './time.js';

const mockSessions = [
  { start: "09:00", end: "10:00", days: { Monday: "Math", Wednesday: "Math" } },
  { start: "10:15", end: "11:15", days: { Monday: "Science", Wednesday: "Science" } },
  { start: "12:00", end: "13:00", days: { Monday: "Lunch" } },
];
const mockDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

test('getDaySchedule filters correctly', () => {
  const mon = getDaySchedule(0, mockSessions, mockDays);
  assert.strictEqual(mon.length, 3);
  assert.strictEqual(mon[0].text, "Math");
  
  const tue = getDaySchedule(1, mockSessions, mockDays);
  assert.strictEqual(tue.length, 0); // Nothing scheduled
});

test('getTimelineBounds calculates min and max correctly', () => {
  const bounds = getTimelineBounds(mockSessions);
  assert.strictEqual(bounds.start, toMinutes("09:00"));
  assert.strictEqual(bounds.end, toMinutes("13:00"));
});

test('getNowState identifies before school', () => {
  const state = getNowState(toMinutes("08:30"), 0, mockSessions, mockDays);
  assert.strictEqual(state.type, 'before');
  assert.strictEqual(state.remaining, 30);
});

test('getNowState identifies active class', () => {
  const state = getNowState(toMinutes("09:30"), 0, mockSessions, mockDays);
  assert.strictEqual(state.type, 'active');
  assert.strictEqual(state.current.text, 'Math');
  assert.strictEqual(state.remaining, 30);
});

test('getNowState identifies passing period', () => {
  const state = getNowState(toMinutes("10:05"), 0, mockSessions, mockDays);
  assert.strictEqual(state.type, 'passing');
  assert.strictEqual(state.next.text, 'Science');
  assert.strictEqual(state.remaining, 10);
});

test('getNowState identifies after school', () => {
  const state = getNowState(toMinutes("14:00"), 0, mockSessions, mockDays);
  assert.strictEqual(state.type, 'after');
});

test('getNowState identifies weekend or empty day', () => {
  const state = getNowState(toMinutes("10:00"), 1, mockSessions, mockDays);
  assert.strictEqual(state.type, 'weekend'); // or empty day acts like weekend
});

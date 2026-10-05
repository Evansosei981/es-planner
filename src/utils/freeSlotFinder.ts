import { Course, Exam, StudySession } from '../types';
import { FreeSlot, TimeSlot, DayTask } from '../types/planner';

export interface FreeSlotFinderOptions {
  date: Date | string | number;
  studyWindow?: TimeSlot; // Default 16:00 to 21:00
  classes?: Course[];
  exams?: Exam[];
  studySessions?: StudySession[];
  dayTasks?: DayTask[];
  daysOff?: number[]; // 1=Mon, ..., 7=Sun
  sleepWindow?: { startHour: number; endHour: number }; // Default 23 to 7
  minDurationMinutes?: number; // Default 15 min
}

/**
 * Helper to parse "HH:MM" string or TimeSlot object
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.split(':').map(Number);
  const hour = isNaN(parts[0]) ? 16 : parts[0];
  const minute = isNaN(parts[1]) ? 0 : parts[1];
  return { hour, minute };
}

/**
 * Pure, testable Free-Slot Finder function.
 * Given a date, returns free time windows within the study window,
 * minus classes, other exams, existing study sessions, sleep time, and days off.
 */
export function findFreeSlotsForDate(options: FreeSlotFinderOptions): FreeSlot[] {
  const {
    date,
    studyWindow = { startHour: 16, startMinute: 0, endHour: 21, endMinute: 0 },
    classes = [],
    exams = [],
    studySessions = [],
    dayTasks = [],
    daysOff = [],
    minDurationMinutes = 15
  } = options;

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    return [];
  }

  // 1 = Monday, ..., 7 = Sunday
  const jsDay = targetDate.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  // Check if target day is marked as a day off
  if (daysOff.includes(dayOfWeek)) {
    return [];
  }

  // Target date string in "YYYY-MM-DD" local time
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();
  const targetDateKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

  const windowStartMin = Math.max(0, Math.min(1439, studyWindow.startHour * 60 + studyWindow.startMinute));
  const windowEndMin = Math.max(0, Math.min(1440, studyWindow.endHour * 60 + studyWindow.endMinute));

  if (windowEndMin <= windowStartMin) {
    return [];
  }

  interface Interval {
    start: number;
    end: number;
  }

  const busyIntervals: Interval[] = [];

  // 1. Classes: scheduled on this day of week
  for (const c of classes) {
    if (c.dayOfWeek === dayOfWeek) {
      const cStart = c.startHour * 60 + c.startMinute;
      const cEnd = c.endHour * 60 + c.endMinute;
      if (cEnd > cStart) {
        busyIntervals.push({ start: cStart, end: cEnd });
      }
    }
  }

  // 2. Exams: on this specific date
  for (const exam of exams) {
    const examDate = new Date(exam.timestampMillis);
    if (
      examDate.getFullYear() === targetYear &&
      examDate.getMonth() === targetMonth &&
      examDate.getDate() === targetDay
    ) {
      const eTime = examDate.getHours() * 60 + examDate.getMinutes();
      // Block exam period: 30m before start to 120m after start (approx 2h exam + buffer)
      const eStart = Math.max(0, eTime - 30);
      const eEnd = Math.min(1440, eTime + 120);
      busyIntervals.push({ start: eStart, end: eEnd });
    }
  }

  // 3. Existing Study Sessions: on this date or recurring dayOfWeek
  for (const s of studySessions) {
    let matchesDate = false;
    if (s.dateMillis) {
      const sDate = new Date(s.dateMillis);
      matchesDate =
        sDate.getFullYear() === targetYear &&
        sDate.getMonth() === targetMonth &&
        sDate.getDate() === targetDay;
    } else if (s.dayOfWeek === dayOfWeek) {
      matchesDate = true;
    }

    if (matchesDate) {
      const sStart = s.startHour * 60 + s.startMinute;
      const sEnd = sStart + s.durationMinutes;
      busyIntervals.push({ start: sStart, end: sEnd });
    }
  }

  // 4. Day Tasks: tasks with scheduledTime on this dateKey
  for (const t of dayTasks) {
    if (t.dateKey === targetDateKey && t.scheduledTime) {
      const tStart = t.scheduledTime.startHour * 60 + t.scheduledTime.startMinute;
      const tEnd = t.scheduledTime.endHour * 60 + t.scheduledTime.endMinute;
      if (tEnd > tStart) {
        busyIntervals.push({ start: tStart, end: tEnd });
      }
    }
  }

  // Clip busy intervals to study window
  const clipped: Interval[] = [];
  for (const b of busyIntervals) {
    const start = Math.max(windowStartMin, b.start);
    const end = Math.min(windowEndMin, b.end);
    if (end > start) {
      clipped.push({ start, end });
    }
  }

  // Sort intervals by start time
  clipped.sort((a, b) => a.start - b.start);

  // Merge overlapping and touching intervals
  const merged: Interval[] = [];
  for (const cur of clipped) {
    if (merged.length === 0) {
      merged.push({ ...cur });
    } else {
      const prev = merged[merged.length - 1];
      if (cur.start <= prev.end) {
        prev.end = Math.max(prev.end, cur.end);
      } else {
        merged.push({ ...cur });
      }
    }
  }

  // Find free gaps inside [windowStartMin, windowEndMin]
  const freeSlots: FreeSlot[] = [];
  let currentPointer = windowStartMin;

  for (const busy of merged) {
    if (busy.start > currentPointer) {
      const duration = busy.start - currentPointer;
      if (duration >= minDurationMinutes) {
        freeSlots.push({
          startHour: Math.floor(currentPointer / 60),
          startMinute: currentPointer % 60,
          endHour: Math.floor(busy.start / 60),
          endMinute: busy.start % 60,
          durationMinutes: duration
        });
      }
    }
    currentPointer = Math.max(currentPointer, busy.end);
  }

  // Check remaining gap at the end of the window
  if (currentPointer < windowEndMin) {
    const duration = windowEndMin - currentPointer;
    if (duration >= minDurationMinutes) {
      freeSlots.push({
        startHour: Math.floor(currentPointer / 60),
        startMinute: currentPointer % 60,
        endHour: Math.floor(windowEndMin / 60),
        endMinute: windowEndMin % 60,
        durationMinutes: duration
      });
    }
  }

  return freeSlots;
}

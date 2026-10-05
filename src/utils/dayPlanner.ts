import { Course, Exam, StudySession } from '../types';
import { DayTask, TimeSlot, FreeSlot } from '../types/planner';
import { findFreeSlotsForDate } from './freeSlotFinder';

export interface AutoFitOptions {
  date: Date | string;
  tasks: DayTask[];
  studyWindow?: TimeSlot;
  classes?: Course[];
  exams?: Exam[];
  studySessions?: StudySession[];
  bufferMinutes?: number; // default 10
}

export interface AutoFitResult {
  fittedTasks: DayTask[];
  unfittedTasks: DayTask[];
  usedSlots: { slot: FreeSlot; task: DayTask }[];
}

/**
 * Places tasks into free gaps, highest priority first, with 10-minute buffers.
 * Tasks that don't fit appear under unfittedTasks ("Move to tomorrow").
 */
export function autoFitDayTasks(options: AutoFitOptions): AutoFitResult {
  const {
    date,
    tasks,
    studyWindow = { startHour: 16, startMinute: 0, endHour: 21, endMinute: 0 },
    classes = [],
    exams = [],
    studySessions = [],
    bufferMinutes = 10
  } = options;

  // Clone tasks to avoid mutating parameters
  const pendingTasks = [...tasks];

  // Sort tasks: Top priority first, then high -> medium -> low, then shortest estimatedMinutes
  const priorityScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
  pendingTasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.isTopPriority !== b.isTopPriority) return a.isTopPriority ? -1 : 1;
    const pDiff = (priorityScore[b.priority] || 1) - (priorityScore[a.priority] || 1);
    if (pDiff !== 0) return pDiff;
    return a.estimatedMinutes - b.estimatedMinutes;
  });

  // Find initial free slots without tasks
  const freeSlots = findFreeSlotsForDate({
    date,
    studyWindow,
    classes,
    exams,
    studySessions,
    minDurationMinutes: 15
  });

  // Track remaining free intervals
  interface DynamicInterval {
    start: number; // in minutes from midnight
    end: number;
  }

  const availableGaps: DynamicInterval[] = freeSlots.map(s => ({
    start: s.startHour * 60 + s.startMinute,
    end: s.endHour * 60 + s.endMinute
  }));

  const fittedTasks: DayTask[] = [];
  const unfittedTasks: DayTask[] = [];
  const usedSlots: { slot: FreeSlot; task: DayTask }[] = [];

  for (const task of pendingTasks) {
    if (task.completed) {
      fittedTasks.push(task);
      continue;
    }

    const taskDuration = Math.max(15, task.estimatedMinutes);
    let wasFitted = false;

    for (let i = 0; i < availableGaps.length; i++) {
      const gap = availableGaps[i];
      const gapDuration = gap.end - gap.start;

      if (gapDuration >= taskDuration) {
        // Fits here!
        const taskStartMin = gap.start;
        const taskEndMin = taskStartMin + taskDuration;

        const scheduledTime = {
          startHour: Math.floor(taskStartMin / 60),
          startMinute: taskStartMin % 60,
          endHour: Math.floor(taskEndMin / 60),
          endMinute: taskEndMin % 60
        };

        const updatedTask: DayTask = {
          ...task,
          scheduledTime
        };

        fittedTasks.push(updatedTask);
        usedSlots.push({
          slot: {
            startHour: scheduledTime.startHour,
            startMinute: scheduledTime.startMinute,
            endHour: scheduledTime.endHour,
            endMinute: scheduledTime.endMinute,
            durationMinutes: taskDuration
          },
          task: updatedTask
        });

        // Update remaining gap with buffer
        const nextStart = taskEndMin + bufferMinutes;
        if (nextStart < gap.end) {
          gap.start = nextStart;
        } else {
          // Gap is fully consumed
          availableGaps.splice(i, 1);
        }

        wasFitted = true;
        break;
      }
    }

    if (!wasFitted) {
      unfittedTasks.push({
        ...task,
        scheduledTime: undefined
      });
    }
  }

  return { fittedTasks, unfittedTasks, usedSlots };
}

/**
 * Handles daily evening / next-morning rollover:
 * Unfinished tasks roll to today with incremented rolloverCount.
 * Tasks with rolloverCount >= 2 require a decision: "Keep, shorten or drop?".
 */
export function processTaskRollovers(
  tasks: DayTask[],
  todayDateKey: string
): {
  updatedTasks: DayTask[];
  tasksNeedingDecision: DayTask[];
  rolledCount: number;
} {
  const updatedTasks: DayTask[] = [];
  const tasksNeedingDecision: DayTask[] = [];
  let rolledCount = 0;

  for (const t of tasks) {
    if (!t.completed && t.dateKey < todayDateKey) {
      // Roll to today
      const newRollover = (t.rolloverCount || 0) + 1;
      const rolled: DayTask = {
        ...t,
        dateKey: todayDateKey,
        scheduledTime: undefined,
        rolloverCount: newRollover
      };

      updatedTasks.push(rolled);
      rolledCount++;

      if (newRollover >= 2) {
        tasksNeedingDecision.push(rolled);
      }
    } else {
      updatedTasks.push(t);
    }
  }

  return { updatedTasks, tasksNeedingDecision, rolledCount };
}

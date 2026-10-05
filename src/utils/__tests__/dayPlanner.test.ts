import { autoFitDayTasks, processTaskRollovers } from '../dayPlanner';
import { DayTask } from '../../types/planner';

export function runDayPlannerTests() {
  console.log("Running Day Planner Tests...");

  const baseDate = new Date(2026, 9, 2); // Oct 2, 2026

  const tasks: DayTask[] = [
    {
      id: "t1",
      title: "Review Math Proofs",
      estimatedMinutes: 45,
      priority: "high",
      isTopPriority: true,
      completed: false,
      rolloverCount: 0,
      dateKey: "2026-10-02",
      createdAt: Date.now()
    },
    {
      id: "t2",
      title: "Read Chapter 4",
      estimatedMinutes: 60,
      priority: "medium",
      isTopPriority: false,
      completed: false,
      rolloverCount: 0,
      dateKey: "2026-10-02",
      createdAt: Date.now()
    },
    {
      id: "t3",
      title: "Write essay outline",
      estimatedMinutes: 90,
      priority: "low",
      isTopPriority: false,
      completed: false,
      rolloverCount: 0,
      dateKey: "2026-10-02",
      createdAt: Date.now()
    }
  ];

  // Test 1: Auto-fit inside 16:00 - 19:00 (180 mins)
  const result = autoFitDayTasks({
    date: baseDate,
    tasks,
    studyWindow: { startHour: 16, startMinute: 0, endHour: 19, endMinute: 0 },
    bufferMinutes: 10
  });

  // t1: 45m (16:00 - 16:45) + 10m buffer = 16:55
  // t2: 60m (16:55 - 17:55) + 10m buffer = 18:05
  // t3: 90m (needs 90m, remaining from 18:05 to 19:00 is only 55m -> should not fit!)
  console.assert(result.fittedTasks.length === 2, `Expected 2 fitted tasks, got ${result.fittedTasks.length}`);
  console.assert(result.unfittedTasks.length === 1, `Expected 1 unfitted task, got ${result.unfittedTasks.length}`);
  console.assert(result.unfittedTasks[0].id === "t3", "Expected t3 to be unfitted");

  // Test 2: Rollover logic
  const oldTasks: DayTask[] = [
    {
      id: "tOld",
      title: "Finish assignment 1",
      estimatedMinutes: 30,
      priority: "high",
      isTopPriority: true,
      completed: false,
      rolloverCount: 1, // Will become 2
      dateKey: "2026-10-01",
      createdAt: Date.now() - 86400000
    }
  ];

  const rollResult = processTaskRollovers(oldTasks, "2026-10-02");
  console.assert(rollResult.rolledCount === 1, "Expected 1 rolled task");
  console.assert(rollResult.tasksNeedingDecision.length === 1, "Expected 1 task needing decision");
  console.assert(rollResult.tasksNeedingDecision[0].rolloverCount === 2, "Expected rolloverCount to be 2");

  console.log("All Day Planner Tests Passed! ✅");
}

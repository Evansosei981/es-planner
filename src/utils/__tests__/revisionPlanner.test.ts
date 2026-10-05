import { generateExamRevisionPlan, getWeightedCourseTopics } from '../revisionPlanner';
import { Exam, Course, StudySession } from '../../types';
import { PracticeQuestion } from '../../types/practice';

export function runRevisionPlannerTests() {
  console.log("Running Revision Planner Tests...");

  const baseDate = new Date(2026, 9, 1, 10, 0, 0); // Oct 1, 2026
  const examDate = new Date(2026, 9, 8, 9, 0, 0);  // Oct 8, 2026 (7 days away)

  const exam: Exam = {
    id: 101,
    courseName: "Algorithms",
    examTitle: "Final Exam",
    timestampMillis: examDate.getTime(),
    colorIndex: 0
  };

  const sampleQuestions: PracticeQuestion[] = [
    {
      id: "q1",
      courseName: "Algorithms",
      category: "Dynamic Programming",
      difficulty: "hard",
      question: "Knapsack problem",
      type: "short_answer",
      options: [],
      correctAnswer: "O(nW)",
      explanation: "DP table"
    },
    {
      id: "q2",
      courseName: "Algorithms",
      category: "Graph Search",
      difficulty: "medium",
      question: "Dijkstra complexity",
      type: "short_answer",
      options: [],
      correctAnswer: "O(E log V)",
      explanation: "Min heap"
    }
  ];

  // Test 1: Weighted topics extraction
  const topics = getWeightedCourseTopics("Algorithms", sampleQuestions);
  console.assert(topics.length === 2, `Expected 2 topics, got ${topics.length}`);
  console.assert(topics.some(t => t.topic === "Dynamic Programming"), "Expected Dynamic Programming");

  // Test 2: Generate plan
  const plan = generateExamRevisionPlan({
    exam,
    questionBank: sampleQuestions,
    currentDate: baseDate,
    settings: {
      studyWindowStart: "16:00",
      studyWindowEnd: "20:00",
      maxHoursPerDay: 2,
      blockMinutes: 50,
      breakMinutes: 10
    }
  });

  console.assert(plan.blocks.length > 0, `Expected blocks > 0, got ${plan.blocks.length}`);
  console.assert(plan.readinessSummary.includes("days left"), "Expected readiness summary with days left");

  // Verify that day before exam finishes by 20:00 (Rule 5)
  const dayBeforeExamKey = "2026-10-07";
  const blocksOnDayBefore = plan.blocks.filter(b => b.formattedDate === dayBeforeExamKey);
  console.assert(blocksOnDayBefore.length <= 2, "Expected max 2 blocks on day before exam");
  for (const b of blocksOnDayBefore) {
    const endMinutes = b.startHour * 60 + b.startMinute + b.durationMinutes;
    console.assert(endMinutes <= 20 * 60, `Block should finish by 20:00, finished at ${endMinutes / 60}`);
  }

  // Verify that no two consecutive blocks on the same day have the exact same topic (Rule 3)
  const blocksByDay: Record<string, string[]> = {};
  plan.blocks.forEach(b => {
    if (!blocksByDay[b.formattedDate]) blocksByDay[b.formattedDate] = [];
    blocksByDay[b.formattedDate].push(b.topic);
  });

  for (const [day, dayTopics] of Object.entries(blocksByDay)) {
    for (let i = 1; i < dayTopics.length; i++) {
      console.assert(
        dayTopics[i] !== dayTopics[i - 1],
        `Consecutive blocks on ${day} should have different topics, got ${dayTopics[i]}`
      );
    }
  }

  console.log("All Revision Planner Tests Passed! ✅");
}

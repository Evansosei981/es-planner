import { AnswerChecker } from '../AnswerChecker';
import { StreakCalculator } from '../StreakCalculator';
import { QuestionSelector } from '../QuestionSelector';
import { DayKey } from '../DayKey';
import { DuplicateDetector } from '../DuplicateDetector';
import { LocalQuestionParser } from '../LocalQuestionParser';
import { DEFAULT_QUESTION_BANK } from '../PracticeConstants';

export function runPracticeTests() {
  console.log("Running Extended Daily Practice Tests...");

  // 1. AnswerChecker tests
  console.assert(AnswerChecker.checkAnswer("O(log n)", "O(log n)") === true, "Exact match should pass");
  console.assert(AnswerChecker.checkAnswer(" o(log n) ", "O(log n)") === true, "Case and whitespace insensitive should pass");
  console.assert(AnswerChecker.checkAnswer("O(n)", "O(log n)") === false, "Incorrect answer should fail");
  console.assert(AnswerChecker.checkAnswer("0.5", "0.50", "short_answer") === true, "Numeric equivalence should pass");

  // 2. DayKey tests
  const today = DayKey.getTodayKey();
  const yesterday = DayKey.getYesterdayKey();
  console.assert(DayKey.isConsecutive(yesterday, today) === true, "Yesterday and today must be consecutive");

  // 3. StreakCalculator tests
  const initialStreak = { currentStreak: 3, longestStreak: 5, lastCompletedDay: yesterday };
  const updated = StreakCalculator.recordPracticeCompletion(initialStreak);
  console.assert(updated.currentStreak === 4, "Consecutive day should increment streak");
  console.assert(updated.lastCompletedDay === today, "Last completed day should be updated to today");

  // Re-completing on same day should maintain streak
  const sameDay = StreakCalculator.recordPracticeCompletion(updated);
  console.assert(sameDay.currentStreak === 4, "Same day completion should maintain streak");

  // 4. DuplicateDetector tests
  const existingDup = DuplicateDetector.findDuplicateQuestion(
    "What is the worst-case time complexity of searching in an AVL tree with n nodes?",
    DEFAULT_QUESTION_BANK
  );
  console.assert(existingDup !== null, "Duplicate question text should be detected");

  const nonDup = DuplicateDetector.findDuplicateQuestion(
    "Completely novel unique question about quantum computing?",
    DEFAULT_QUESTION_BANK
  );
  console.assert(nonDup === null, "Unique question text should not be flagged as duplicate");

  // 5. LocalQuestionParser tests
  const sampleExerciseText = `
1. What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Answer: B

2. A deadlock can occur if circular wait exists.
Answer: True
`;
  const parsedQuestions = LocalQuestionParser.parseTextToQuestions(sampleExerciseText, "Math 101");
  console.assert(parsedQuestions.length === 2, `Should extract 2 questions, got ${parsedQuestions.length}`);
  console.assert(parsedQuestions[0].type === 'multiple_choice', "First question should be multiple choice");
  console.assert(parsedQuestions[0].correctAnswer === '4', "First question correct answer should be resolved to option text '4'");
  console.assert(parsedQuestions[1].type === 'true_false', "Second question should be true/false");

  // 6. QuestionSelector tests with targets (1, 2, 5, 10)
  const daily1 = QuestionSelector.selectDailyQuestions(DEFAULT_QUESTION_BANK, today, [], 1);
  console.assert(daily1.length === 1, "Daily questions should select 1 question when target=1");

  const daily5 = QuestionSelector.selectDailyQuestions(DEFAULT_QUESTION_BANK, today, [], 5);
  console.assert(daily5.length === 5, "Daily questions should select 5 questions when target=5");

  // Determinism check: same day should select identical questions
  const daily5Repeat = QuestionSelector.selectDailyQuestions(DEFAULT_QUESTION_BANK, today, [], 5);
  console.assert(
    daily5[0].id === daily5Repeat[0].id && daily5[1].id === daily5Repeat[1].id,
    "Daily questions should be deterministic for the same dayKey"
  );

  // Insufficient questions handling: if requesting 20 from a pool of 10, return available 10
  const smallPool = DEFAULT_QUESTION_BANK.slice(0, 4);
  const insufficientResult = QuestionSelector.selectDailyQuestions(smallPool, today, [], 10);
  console.assert(insufficientResult.length === 4, "Should return available questions when pool is smaller than target");

  console.log("All Daily Practice Tests Passed! ✅");
  return true;
}

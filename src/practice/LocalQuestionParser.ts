import { PracticeQuestion } from '../types/practice';

export const LocalQuestionParser = {
  /**
   * Intelligently parses raw text / exercise sheet strings into structured PracticeQuestion objects
   */
  parseTextToQuestions(
    rawText: string,
    defaultCourse: string = 'General Studies',
    sourceResourceId?: string,
    sourceResourceName?: string
  ): PracticeQuestion[] {
    const questions: PracticeQuestion[] = [];
    if (!rawText || rawText.trim().length === 0) return questions;

    // Split text by numbered questions: e.g. "1.", "Question 1:", "Q1.", etc.
    const questionBlocks = rawText.split(/(?:^|\n+)(?:Question\s*\d+[:.]?|\d+[\.\)]|\(?\d+\))\s+/i);

    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i].trim();
      if (block.length < 10) continue;

      // Extract Answer / Solution if indicated at the end: "Answer: B" or "Solution: ..."
      let answerMatch = block.match(/(?:Ans(?:wer)?|Solution|Correct):\s*([^\n\r]+)/i);
      let correctAnswer = '';
      let cleanBlock = block;

      if (answerMatch) {
        correctAnswer = answerMatch[1].trim();
        cleanBlock = block.replace(answerMatch[0], '').trim();
      }

      // Check for multiple choice options: A) ... B) ... or a) ... b) ...
      const optionMatches = [...cleanBlock.matchAll(/(?:^|\n|\s+)([A-D\d]\)|\([A-D\d]\)|[A-D]\.)\s*([^\n]+)/gi)];
      
      let type: 'multiple_choice' | 'true_false' | 'short_answer' = 'short_answer';
      let options: string[] = [];
      let questionText = cleanBlock;

      if (optionMatches.length >= 2) {
        type = 'multiple_choice';
        // Extract the main question text before the first option
        const firstOptionIndex = cleanBlock.indexOf(optionMatches[0][0]);
        if (firstOptionIndex > 0) {
          questionText = cleanBlock.substring(0, firstOptionIndex).trim();
        }
        options = optionMatches.map(m => m[2].trim());

        // Normalize correctAnswer if it references a letter like "A" or "B"
        if (correctAnswer.length === 1 && /[A-D]/i.test(correctAnswer)) {
          const letterIdx = correctAnswer.toUpperCase().charCodeAt(0) - 65;
          if (options[letterIdx]) {
            correctAnswer = options[letterIdx];
          }
        }
      } else if (
        /\b(true\s*or\s*false|is\s+it\s+true)\b/i.test(cleanBlock) ||
        /\b(True|False)\b/i.test(correctAnswer)
      ) {
        type = 'true_false';
        options = ['True', 'False'];
      }

      // If no explicit answer found, provide smart default based on type
      if (!correctAnswer) {
        if (type === 'multiple_choice' && options.length > 0) {
          correctAnswer = options[0];
        } else if (type === 'true_false') {
          correctAnswer = 'True';
        } else {
          correctAnswer = 'Review required';
        }
      }

      // Topic detection heuristics
      let detectedTopic = 'General Topic';
      if (/calculus|derivative|integral|limit/i.test(cleanBlock)) detectedTopic = 'Calculus';
      else if (/matrix|vector|eigen/i.test(cleanBlock)) detectedTopic = 'Linear Algebra';
      else if (/database|sql|table|relation|acid/i.test(cleanBlock)) detectedTopic = 'Database Systems';
      else if (/deadlock|paging|cpu|process|thread/i.test(cleanBlock)) detectedTopic = 'Operating Systems';
      else if (/algorithm|sort|tree|graph|complexity|heap/i.test(cleanBlock)) detectedTopic = 'Algorithms';

      questions.push({
        id: `extracted-${Date.now()}-${i}`,
        courseName: defaultCourse,
        subject: defaultCourse,
        category: detectedTopic,
        difficulty: cleanBlock.length > 150 ? 'medium' : 'easy',
        question: questionText.replace(/^[\d\.\)\:\s]+/, '').trim(),
        type,
        options: options.length > 0 ? options : (type === 'true_false' ? ['True', 'False'] : []),
        correctAnswer,
        explanation: `Extracted from ${sourceResourceName || 'uploaded exercise material'}. Review the problem steps to solidify understanding.`,
        sourceResourceId,
        sourceResourceName,
        createdAt: Date.now()
      });
    }

    return questions;
  }
};

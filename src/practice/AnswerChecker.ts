export const AnswerChecker = {
  checkAnswer(
    userAnswer: string,
    correctAnswer: string,
    type: 'multiple_choice' | 'true_false' | 'short_answer' = 'multiple_choice'
  ): boolean {
    if (!userAnswer || !correctAnswer) return false;

    const cleanUser = userAnswer.trim().toLowerCase();
    const cleanCorrect = correctAnswer.trim().toLowerCase();

    if (cleanUser === cleanCorrect) {
      return true;
    }

    if (type === 'short_answer') {
      // Check numeric equivalence if both are numbers (e.g. "0.5" vs ".5" or "4" vs "4.0")
      const numUser = parseFloat(cleanUser);
      const numCorrect = parseFloat(cleanCorrect);
      if (!isNaN(numUser) && !isNaN(numCorrect)) {
        return Math.abs(numUser - numCorrect) < 0.0001;
      }

      // Check without punctuation
      const stripPunct = (s: string) => s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ");
      if (stripPunct(cleanUser) === stripPunct(cleanCorrect)) {
        return true;
      }
    }

    return false;
  }
};

import prisma from '../config/database.js';

/**
 * Dynamic Quiz Generation Algorithm
 * Selects 10 questions based on:
 * 1. Complexity distribution (configurable)
 * 2. Excludes questions user answered correctly before
 * 3. Random selection from available pool
 */
async function generateQuiz(userId, complexityDistribution = { easy: 4, moderate: 4, complex: 2 }) {
  try {
    // Get all questions user has answered correctly (to exclude)
    const correctHistory = await prisma.userQuestionHistory.findMany({
      where: {
        userId: userId,
        isCorrect: true
      },
      select: { questionId: true }
    });

    const excludedQuestionIds = correctHistory.map(h => h.questionId);

    // Build query to get available questions
    // Conditionally construct where clause to avoid passing undefined to notIn
    const whereClause = excludedQuestionIds.length > 0
      ? { id: { notIn: excludedQuestionIds } }
      : {};

    const availableQuestions = await prisma.question.findMany({
      where: whereClause,
      include: {
        options: {
          orderBy: { optionLetter: 'asc' }
        }
      }
    });

    // Group questions by complexity
    const questionsByComplexity = {
      easy: availableQuestions.filter(q => q.complexityLevel === 'easy'),
      moderate: availableQuestions.filter(q => q.complexityLevel === 'moderate'),
      complex: availableQuestions.filter(q => q.complexityLevel === 'complex')
    };

    // Select questions based on distribution
    const selectedQuestions = [];

    /**
     * Fisher-Yates shuffle algorithm for unbiased randomization
     * @param {Array} array - Array to shuffle
     * @returns {Array} - Shuffled array
     */
    const shuffle = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Helper function to randomly select from array
    const randomSelect = (array, count) => {
      const shuffled = shuffle(array);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    // Select from each complexity level
    selectedQuestions.push(...randomSelect(questionsByComplexity.easy, complexityDistribution.easy));
    selectedQuestions.push(...randomSelect(questionsByComplexity.moderate, complexityDistribution.moderate));
    selectedQuestions.push(...randomSelect(questionsByComplexity.complex, complexityDistribution.complex));

    // If we don't have enough questions, fill from available pool
    if (selectedQuestions.length < 10) {
      const remaining = 10 - selectedQuestions.length;
      const selectedIds = selectedQuestions.map(q => q.id);
      const additionalQuestions = shuffle(
        availableQuestions.filter(q => !selectedIds.includes(q.id))
      ).slice(0, remaining);

      selectedQuestions.push(...additionalQuestions);
    }

    // Shuffle final selection using Fisher-Yates
    const finalQuestions = shuffle(selectedQuestions).slice(0, 10);

    return finalQuestions;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

export { generateQuiz };


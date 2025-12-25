const prisma = require('../config/database');

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
    const availableQuestions = await prisma.question.findMany({
      where: {
        id: {
          notIn: excludedQuestionIds.length > 0 ? excludedQuestionIds : undefined
        }
      },
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
    
    // Helper function to randomly select from array
    const randomSelect = (array, count) => {
      const shuffled = [...array].sort(() => 0.5 - Math.random());
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
      const additionalQuestions = availableQuestions
        .filter(q => !selectedIds.includes(q.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, remaining);
      
      selectedQuestions.push(...additionalQuestions);
    }

    // Shuffle final selection
    const finalQuestions = selectedQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);

    return finalQuestions;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

module.exports = { generateQuiz };


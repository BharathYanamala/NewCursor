const prisma = require('../config/database');
const { generateQuiz } = require('../services/quizGenerator');

// Start a new quiz
async function startQuiz(req, res) {
  try {
    const userId = req.user.id;

    // Generate quiz questions
    const questions = await generateQuiz(userId);

    if (questions.length < 10) {
      return res.status(400).json({
        error: 'Not enough questions available. Please contact admin.'
      });
    }

    // Create quiz attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId: userId,
        totalQuestions: questions.length
      }
    });

    // Create placeholder quiz answers to track which questions are in this quiz
    // This prevents submission of arbitrary question IDs
    await prisma.quizAnswer.createMany({
      data: questions.map(q => ({
        quizAttemptId: quizAttempt.id,
        questionId: q.id,
        userAnswer: '', // Placeholder, will be updated on submission
        isCorrect: false
      }))
    });

    // Return questions without correct answers
    const questionsForUser = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      complexityLevel: q.complexityLevel,
      options: q.options.map(opt => ({
        letter: opt.optionLetter,
        text: opt.optionText
      }))
    }));

    res.json({
      quizAttemptId: quizAttempt.id,
      questions: questionsForUser
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
}

// Submit quiz answers
async function submitQuiz(req, res) {
  try {
    const { quizAttemptId, answers } = req.body;
    const userId = req.user.id;

    // Validate quiz attempt belongs to user
    const quizAttempt = await prisma.quizAttempt.findFirst({
      where: {
        id: quizAttemptId,
        userId: userId
      }
    });

    if (!quizAttempt) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    if (quizAttempt.submittedAt) {
      return res.status(400).json({ error: 'Quiz already submitted' });
    }

    // Validate that all submitted question IDs belong to this quiz attempt
    // Get the original question IDs for this quiz attempt
    const originalQuizAnswers = await prisma.quizAnswer.findMany({
      where: { quizAttemptId: quizAttemptId },
      select: { questionId: true }
    });

    const originalQuestionIds = new Set(originalQuizAnswers.map(qa => qa.questionId));
    const submittedQuestionIds = answers.map(a => a.questionId);

    // Validate all submitted questions were part of the original quiz
    const invalidQuestionIds = submittedQuestionIds.filter(id => !originalQuestionIds.has(id));
    if (invalidQuestionIds.length > 0) {
      return res.status(400).json({
        error: 'Invalid question IDs submitted. All questions must be from the original quiz attempt.',
        invalidQuestionIds: invalidQuestionIds
      });
    }

    // Validate that we have answers for all questions
    if (submittedQuestionIds.length !== originalQuestionIds.size) {
      return res.status(400).json({
        error: `Expected ${originalQuestionIds.size} answers, but received ${submittedQuestionIds.length}`
      });
    }

    // Get all questions with correct answers
    const questions = await prisma.question.findMany({
      where: { id: { in: submittedQuestionIds } },
      include: { options: true }
    });

    // Create a map for quick lookup
    const questionMap = new Map(questions.map(q => [q.id, q]));

    let score = 0;
    const results = [];

    // Process each answer
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        // This should not happen after validation, but handle gracefully
        return res.status(400).json({
          error: `Question ID ${answer.questionId} not found in database`
        });
      }

      let isCorrect = false;

      if (question.questionType === 'objective') {
        // For objective, compare with correct answer
        isCorrect = answer.userAnswer.trim().toUpperCase() ===
          question.correctAnswer.trim().toUpperCase();
      } else {
        // For fill_blank, case-insensitive comparison
        isCorrect = answer.userAnswer.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();
      }

      if (isCorrect) score++;

      // Update the existing quiz answer record (created when quiz started)
      await prisma.quizAnswer.updateMany({
        where: {
          quizAttemptId: quizAttemptId,
          questionId: answer.questionId
        },
        data: {
          userAnswer: answer.userAnswer,
          isCorrect: isCorrect
        }
      });

      // Update user question history
      await prisma.userQuestionHistory.upsert({
        where: {
          userId_questionId: {
            userId: userId,
            questionId: answer.questionId
          }
        },
        update: {
          isCorrect: isCorrect,
          lastAttemptedAt: new Date()
        },
        create: {
          userId: userId,
          questionId: answer.questionId,
          isCorrect: isCorrect
        }
      });

      // Prepare result for response
      results.push({
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        userAnswer: answer.userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        options: question.options?.map(opt => ({
          letter: opt.optionLetter,
          text: opt.optionText
        })) || []
      });
    }

    // Update quiz attempt
    await prisma.quizAttempt.update({
      where: { id: quizAttemptId },
      data: {
        submittedAt: new Date(),
        score: score
      }
    });

    res.json({
      quizAttemptId: quizAttemptId,
      score: score,
      totalQuestions: quizAttempt.totalQuestions,
      results: results
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
}

module.exports = { startQuiz, submitQuiz };


// Use the same database connection as the main application
import prisma from '../src/config/database.js';

async function deleteNonHtmlQuestions() {
  try {
    console.log('🗑️  Checking for questions in the database...');

    // First, check if questions exist
    let questionCount = 0;
    try {
      questionCount = await prisma.question.count();
      console.log(`📊 Found ${questionCount} total questions in the database`);
    } catch (error) {
      if (error.code === 'P2021') {
        console.log('ℹ️  Questions table does not exist. Database appears to be empty or not initialized.');
        console.log('💡 If you need to create tables, run: npm run prisma:migrate');
        return;
      }
      throw error;
    }

    if (questionCount === 0) {
      console.log('ℹ️  No questions found. Database is already empty.');
      return;
    }

    // Count HTML questions
    const htmlCount = await prisma.question.count({
      where: { subject: 'HTML' }
    });
    
    const nonHtmlCount = questionCount - htmlCount;
    
    console.log(`\n📊 Breakdown:`);
    console.log(`   HTML questions: ${htmlCount}`);
    console.log(`   Non-HTML questions: ${nonHtmlCount}`);

    if (nonHtmlCount === 0) {
      console.log('\n✅ All questions are already HTML questions. Nothing to delete.');
      return;
    }

    // Get all non-HTML question IDs first
    const nonHtmlQuestions = await prisma.question.findMany({
      where: {
        OR: [
          { subject: { not: 'HTML' } },
          { subject: null }
        ]
      },
      select: { id: true }
    });

    const nonHtmlQuestionIds = nonHtmlQuestions.map(q => q.id);

    if (nonHtmlQuestionIds.length === 0) {
      console.log('\n✅ No non-HTML questions found. Nothing to delete.');
      return;
    }

    console.log(`\n🗑️  Deleting ${nonHtmlQuestionIds.length} non-HTML questions and related data...`);

    // Delete in order to respect foreign key constraints
    try {
      // Delete quiz answers for non-HTML questions
      const deletedAnswers = await prisma.quizAnswer.deleteMany({
        where: {
          questionId: { in: nonHtmlQuestionIds }
        }
      });
      if (deletedAnswers.count > 0) {
        console.log(`✓ Deleted ${deletedAnswers.count} quiz answers for non-HTML questions`);
      }
    } catch (error) {
      if (error.code !== 'P2021') throw error;
      console.log('⚠️  Quiz answers table does not exist, skipping...');
    }

    try {
      // Delete user question history for non-HTML questions
      const deletedHistory = await prisma.userQuestionHistory.deleteMany({
        where: {
          questionId: { in: nonHtmlQuestionIds }
        }
      });
      if (deletedHistory.count > 0) {
        console.log(`✓ Deleted ${deletedHistory.count} user question history records for non-HTML questions`);
      }
    } catch (error) {
      if (error.code !== 'P2021') throw error;
      console.log('⚠️  User question history table does not exist, skipping...');
    }

    try {
      // Delete options for non-HTML questions
      const deletedOptions = await prisma.option.deleteMany({
        where: {
          questionId: { in: nonHtmlQuestionIds }
        }
      });
      if (deletedOptions.count > 0) {
        console.log(`✓ Deleted ${deletedOptions.count} options for non-HTML questions`);
      }
    } catch (error) {
      if (error.code !== 'P2021') throw error;
      console.log('⚠️  Options table does not exist, skipping...');
    }

    // Delete non-HTML questions
    const deletedQuestions = await prisma.question.deleteMany({
      where: {
        OR: [
          { subject: { not: 'HTML' } },
          { subject: null }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedQuestions.count} non-HTML questions`);

    // Verify final count
    const remainingCount = await prisma.question.count();
    const remainingHtmlCount = await prisma.question.count({
      where: { subject: 'HTML' }
    });

    console.log('\n✅ Deletion completed successfully!');
    console.log(`\n📊 Final status:`);
    console.log(`   Total questions remaining: ${remainingCount}`);
    console.log(`   HTML questions: ${remainingHtmlCount}`);
    console.log(`   Non-HTML questions: ${remainingCount - remainingHtmlCount}`);

  } catch (error) {
    console.error('❌ Error deleting non-HTML questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteNonHtmlQuestions()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });


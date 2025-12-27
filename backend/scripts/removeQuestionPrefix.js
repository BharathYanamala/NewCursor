// Use the same database connection as the main application
import prisma from '../src/config/database.js';

async function removeQuestionPrefix() {
  try {
    console.log('🔍 Checking questions in the database...');

    // Get all questions
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        questionText: true
      }
    });

    if (questions.length === 0) {
      console.log('ℹ️  No questions found in the database.');
      return;
    }

    console.log(`📊 Found ${questions.length} questions in the database`);

    // Pattern to match: Q followed by digits and a period at the start
    // Examples: Q1., Q123., Q001., etc.
    const prefixPattern = /^Q\d+\.\s*/i;

    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];

    // Process each question
    for (const question of questions) {
      const originalText = question.questionText;
      
      // Check if the question text starts with the prefix pattern
      if (prefixPattern.test(originalText)) {
        // Remove the prefix
        const newText = originalText.replace(prefixPattern, '');
        
        if (newText !== originalText) {
          updates.push({
            id: question.id,
            newText: newText
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`\n📝 Analysis:`);
    console.log(`   Questions with prefix: ${updatedCount}`);
    console.log(`   Questions without prefix: ${skippedCount}`);

    if (updatedCount === 0) {
      console.log('\n✅ No questions need to be updated. All questions are already clean.');
      return;
    }

    console.log(`\n🔄 Updating ${updatedCount} questions...`);

    // Update questions in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      // Update each question in the batch
      await Promise.all(
        batch.map(update =>
          prisma.question.update({
            where: { id: update.id },
            data: { questionText: update.newText }
          })
        )
      );
      
      console.log(`   ✓ Updated ${Math.min(i + batchSize, updates.length)}/${updates.length} questions`);
    }

    console.log('\n✅ Successfully removed prefixes from all questions!');
    
    // Show a sample of updated questions
    if (updatedCount > 0) {
      console.log('\n📋 Sample of updated questions (first 5):');
      const sampleQuestions = await prisma.question.findMany({
        where: {
          id: { in: updates.slice(0, 5).map(u => u.id) }
        },
        select: {
          id: true,
          questionText: true
        }
      });
      
      sampleQuestions.forEach((q, index) => {
        console.log(`   ${index + 1}. ID ${q.id}: "${q.questionText.substring(0, 60)}${q.questionText.length > 60 ? '...' : ''}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error removing question prefixes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removeQuestionPrefix()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });


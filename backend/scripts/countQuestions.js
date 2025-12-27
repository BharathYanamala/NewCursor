// Use the same database connection as the main application
import prisma from '../src/config/database.js';

async function countQuestions() {
  try {
    // Try to count questions directly - if table doesn't exist, it will throw P2021
    const questionCount = await prisma.question.count();
    console.log(`📊 Total questions in database: ${questionCount}`);
    
    if (questionCount === 0) {
      console.log('ℹ️  No questions found in the database.');
      return;
    }
    
    // Show breakdown by complexity
    const easyCount = await prisma.question.count({ where: { complexityLevel: 'easy' } });
    const moderateCount = await prisma.question.count({ where: { complexityLevel: 'moderate' } });
    const complexCount = await prisma.question.count({ where: { complexityLevel: 'complex' } });
    
    console.log(`\n📈 Breakdown by complexity:`);
    console.log(`   Easy: ${easyCount}`);
    console.log(`   Moderate: ${moderateCount}`);
    console.log(`   Complex: ${complexCount}`);
    
    // Show breakdown by subject (if any questions have subjects)
    const questionsWithSubjects = await prisma.question.findMany({
      where: { subject: { not: null } },
      select: { subject: true }
    });
    
    if (questionsWithSubjects.length > 0) {
      const subjectCounts = {};
      questionsWithSubjects.forEach(q => {
        subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
      });
      
      console.log(`\n📚 Breakdown by subject:`);
      Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([subject, count]) => {
          console.log(`   ${subject}: ${count}`);
        });
    }
    
    // Show breakdown by question type
    const objectiveCount = await prisma.question.count({ where: { questionType: 'objective' } });
    const fillBlankCount = await prisma.question.count({ where: { questionType: 'fill_blank' } });
    
    console.log(`\n📝 Breakdown by question type:`);
    console.log(`   Objective: ${objectiveCount}`);
    console.log(`   Fill in the Blank: ${fillBlankCount}`);
    
  } catch (error) {
    if (error.code === 'P2021') {
      console.log('ℹ️  Questions table does not exist. Database appears to be empty or not initialized.');
      console.log('💡 If you need to create tables, run: npm run prisma:migrate');
    } else {
      console.error('❌ Error counting questions:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

countQuestions();


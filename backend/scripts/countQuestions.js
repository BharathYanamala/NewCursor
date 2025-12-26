import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Get the original DATABASE_URL string
const databaseUrlString = process.env.DATABASE_URL || 'file:./dev.db';

// Resolve relative paths to absolute paths for the URL
let resolvedUrl = databaseUrlString;
if (databaseUrlString.startsWith('file:./') || databaseUrlString.startsWith('file:../')) {
  const filePath = databaseUrlString.replace(/^file:/, '');
  const absolutePath = resolve(__dirname, '../../', filePath);
  resolvedUrl = `file:${absolutePath}`;
}

// Create adapter and Prisma client
const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
const prisma = new PrismaClient({ adapter });

async function countQuestions() {
  try {
    // First, check if the questions table exists using raw SQL
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name='questions';
    `;
    
    if (!tables || tables.length === 0) {
      console.log('ℹ️  Questions table does not exist. Database appears to be empty or not initialized.');
      console.log('💡 If you need to create tables, run: npm run prisma:migrate');
      return;
    }
    
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


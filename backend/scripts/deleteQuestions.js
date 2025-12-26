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

async function deleteAllQuestions() {
    try {
        console.log('🗑️  Checking for questions in the database...');

        // First, check if questions exist (handle case where table doesn't exist)
        let questionCount = 0;
        try {
            questionCount = await prisma.question.count();
            console.log(`📊 Found ${questionCount} questions in the database`);
        } catch (error) {
            if (error.code === 'P2021') {
                // Table doesn't exist - database might be empty or not initialized
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

        console.log('\n🗑️  Deleting all questions and related data...');

        // Delete in order to respect foreign key constraints
        try {
            const deletedAnswers = await prisma.quizAnswer.deleteMany();
            if (deletedAnswers.count > 0) {
                console.log(`✓ Deleted ${deletedAnswers.count} quiz answers`);
            }
        } catch (error) {
            if (error.code !== 'P2021') throw error; // P2021 = table doesn't exist
        }

        try {
            const deletedHistory = await prisma.userQuestionHistory.deleteMany();
            if (deletedHistory.count > 0) {
                console.log(`✓ Deleted ${deletedHistory.count} user question history records`);
            }
        } catch (error) {
            if (error.code !== 'P2021') throw error;
        }

        try {
            const deletedOptions = await prisma.option.deleteMany();
            if (deletedOptions.count > 0) {
                console.log(`✓ Deleted ${deletedOptions.count} options`);
            }
        } catch (error) {
            if (error.code !== 'P2021') throw error;
        }

        // Delete questions
        const deletedQuestions = await prisma.question.deleteMany();
        console.log(`✓ Deleted ${deletedQuestions.count} questions`);

        console.log('\n✅ All questions and related data have been deleted successfully!');
    } catch (error) {
        console.error('❌ Error deleting questions:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllQuestions()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    });


import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Get the original DATABASE_URL string
const databaseUrlString = process.env.DATABASE_URL || 'file:./dev.db';

// Resolve relative paths to absolute paths for the URL
let resolvedUrl = databaseUrlString;
if (databaseUrlString.startsWith('file:./') || databaseUrlString.startsWith('file:../')) {
  const filePath = databaseUrlString.replace(/^file:/, '');
  const absolutePath = resolve(__dirname, '../', filePath);
  resolvedUrl = `file:${absolutePath}`;
}

// Create adapter and Prisma client
const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing data...');
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.userQuestionHistory.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log('👥 Creating users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@quiz.com',
      passwordHash: adminPassword,
      role: 'admin'
    }
  });

  const participant1 = await prisma.user.create({
    data: {
      username: 'john_doe',
      email: 'john@quiz.com',
      passwordHash: userPassword,
      role: 'participant'
    }
  });

  const participant2 = await prisma.user.create({
    data: {
      username: 'jane_smith',
      email: 'jane@quiz.com',
      passwordHash: userPassword,
      role: 'participant'
    }
  });

  console.log(`✅ Created ${3} users`);

  // Create Questions
  console.log('❓ Creating questions...');

  const questions = [
    // Easy Questions
    {
      questionText: 'What is the capital of France?',
      questionType: 'objective',
      complexityLevel: 'easy',
      correctAnswer: 'A',
      subject: 'Geography',
      options: [
        { letter: 'A', text: 'Paris' },
        { letter: 'B', text: 'London' },
        { letter: 'C', text: 'Berlin' },
        { letter: 'D', text: 'Madrid' }
      ]
    },
    {
      questionText: 'JavaScript is a _____ language.',
      questionType: 'fill_blank',
      complexityLevel: 'easy',
      correctAnswer: 'programming',
      subject: 'Programming'
    },
    {
      questionText: 'What does HTML stand for?',
      questionType: 'objective',
      complexityLevel: 'easy',
      correctAnswer: 'A',
      subject: 'Web Development',
      options: [
        { letter: 'A', text: 'HyperText Markup Language' },
        { letter: 'B', text: 'High-Level Text Markup Language' },
        { letter: 'C', text: 'Hyperlink and Text Markup Language' },
        { letter: 'D', text: 'Home Tool Markup Language' }
      ]
    },
    {
      questionText: 'The _____ method is used to add an element to the end of an array in JavaScript.',
      questionType: 'fill_blank',
      complexityLevel: 'easy',
      correctAnswer: 'push',
      subject: 'Programming'
    },
    {
      questionText: 'What does CSS stand for?',
      questionType: 'objective',
      complexityLevel: 'easy',
      correctAnswer: 'B',
      subject: 'Web Development',
      options: [
        { letter: 'A', text: 'Computer Style Sheets' },
        { letter: 'B', text: 'Cascading Style Sheets' },
        { letter: 'C', text: 'Creative Style Sheets' },
        { letter: 'D', text: 'Colorful Style Sheets' }
      ]
    },
    {
      questionText: '_____ is used to manage state in React components.',
      questionType: 'fill_blank',
      complexityLevel: 'easy',
      correctAnswer: 'useState',
      subject: 'React'
    },
    {
      questionText: 'What does API stand for?',
      questionType: 'objective',
      complexityLevel: 'easy',
      correctAnswer: 'A',
      subject: 'Programming',
      options: [
        { letter: 'A', text: 'Application Programming Interface' },
        { letter: 'B', text: 'Advanced Programming Interface' },
        { letter: 'C', text: 'Application Program Integration' },
        { letter: 'D', text: 'Advanced Program Integration' }
      ]
    },
    {
      questionText: '_____ is a NoSQL database.',
      questionType: 'fill_blank',
      complexityLevel: 'easy',
      correctAnswer: 'MongoDB',
      subject: 'Database'
    },

    // Moderate Questions
    {
      questionText: 'What does DOM stand for?',
      questionType: 'objective',
      complexityLevel: 'moderate',
      correctAnswer: 'A',
      subject: 'Web Development',
      options: [
        { letter: 'A', text: 'Document Object Model' },
        { letter: 'B', text: 'Data Object Model' },
        { letter: 'C', text: 'Dynamic Object Model' },
        { letter: 'D', text: 'Document Oriented Model' }
      ]
    },
    {
      questionText: 'React uses _____ to update the UI efficiently.',
      questionType: 'fill_blank',
      complexityLevel: 'moderate',
      correctAnswer: 'Virtual DOM',
      subject: 'React'
    },
    {
      questionText: 'What is the purpose of useEffect hook in React?',
      questionType: 'objective',
      complexityLevel: 'moderate',
      correctAnswer: 'A',
      subject: 'React',
      options: [
        { letter: 'A', text: 'To handle side effects' },
        { letter: 'B', text: 'To create components' },
        { letter: 'C', text: 'To style components' },
        { letter: 'D', text: 'To route pages' }
      ]
    },
    {
      questionText: 'What is the output of: console.log(typeof null)?',
      questionType: 'objective',
      complexityLevel: 'moderate',
      correctAnswer: 'C',
      subject: 'Programming',
      options: [
        { letter: 'A', text: 'null' },
        { letter: 'B', text: 'undefined' },
        { letter: 'C', text: 'object' },
        { letter: 'D', text: 'string' }
      ]
    },
    {
      questionText: '_____ allows components to share data without prop drilling.',
      questionType: 'fill_blank',
      complexityLevel: 'moderate',
      correctAnswer: 'Context API',
      subject: 'React'
    },
    {
      questionText: 'What is JSX?',
      questionType: 'objective',
      complexityLevel: 'moderate',
      correctAnswer: 'A',
      subject: 'React',
      options: [
        { letter: 'A', text: 'JavaScript XML' },
        { letter: 'B', text: 'Java Syntax Extension' },
        { letter: 'C', text: 'JSON XML' },
        { letter: 'D', text: 'JavaScript Extension' }
      ]
    },
    {
      questionText: 'What is the purpose of Redux?',
      questionType: 'objective',
      complexityLevel: 'moderate',
      correctAnswer: 'A',
      subject: 'React',
      options: [
        { letter: 'A', text: 'State management' },
        { letter: 'B', text: 'Routing' },
        { letter: 'C', text: 'Styling' },
        { letter: 'D', text: 'Testing' }
      ]
    },
    {
      questionText: 'Which array method creates a new array with transformed elements?',
      questionType: 'objective',
      complexityLevel: 'moderate',
      correctAnswer: 'B',
      subject: 'Programming',
      options: [
        { letter: 'A', text: 'forEach()' },
        { letter: 'B', text: 'map()' },
        { letter: 'C', text: 'filter()' },
        { letter: 'D', text: 'reduce()' }
      ]
    },

    // Complex Questions
    {
      questionText: 'What is the time complexity of binary search?',
      questionType: 'objective',
      complexityLevel: 'complex',
      correctAnswer: 'B',
      subject: 'Algorithms',
      options: [
        { letter: 'A', text: 'O(n)' },
        { letter: 'B', text: 'O(log n)' },
        { letter: 'C', text: 'O(n²)' },
        { letter: 'D', text: 'O(1)' }
      ]
    },
    {
      questionText: 'The _____ algorithm is used for finding shortest paths in a graph.',
      questionType: 'fill_blank',
      complexityLevel: 'complex',
      correctAnswer: 'Dijkstra',
      subject: 'Algorithms'
    },
    {
      questionText: 'What is closure in JavaScript?',
      questionType: 'objective',
      complexityLevel: 'complex',
      correctAnswer: 'A',
      subject: 'Programming',
      options: [
        { letter: 'A', text: 'A function that has access to outer scope variables' },
        { letter: 'B', text: 'A way to close files' },
        { letter: 'C', text: 'A CSS property' },
        { letter: 'D', text: 'A database concept' }
      ]
    },
    {
      questionText: 'The _____ pattern is used to create objects in JavaScript.',
      questionType: 'fill_blank',
      complexityLevel: 'complex',
      correctAnswer: 'Factory',
      subject: 'Design Patterns'
    },
    {
      questionText: 'Which hook is used for performance optimization in React?',
      questionType: 'objective',
      complexityLevel: 'complex',
      correctAnswer: 'A',
      subject: 'React',
      options: [
        { letter: 'A', text: 'useMemo()' },
        { letter: 'B', text: 'useState()' },
        { letter: 'C', text: 'useEffect()' },
        { letter: 'D', text: 'useContext()' }
      ]
    },
    {
      questionText: 'The _____ principle states that a class should have only one reason to change.',
      questionType: 'fill_blank',
      complexityLevel: 'complex',
      correctAnswer: 'Single Responsibility',
      subject: 'Design Patterns'
    }
  ];

  // Insert questions with options
  for (const q of questions) {
    const questionData = {
      questionText: q.questionText,
      questionType: q.questionType,
      complexityLevel: q.complexityLevel,
      correctAnswer: q.correctAnswer,
      subject: q.subject || null,
      options: q.questionType === 'objective' ? {
        create: q.options.map(opt => ({
          optionLetter: opt.letter,
          optionText: opt.text
        }))
      } : undefined
    };

    await prisma.question.create({
      data: questionData
    });
  }

  console.log(`✅ Created ${questions.length} questions`);

  // Summary
  const userCount = await prisma.user.count();
  const questionCount = await prisma.question.count();
  const optionCount = await prisma.option.count();

  console.log('\n📊 Seeding Summary:');
  console.log(`   Users: ${userCount}`);
  console.log(`   Questions: ${questionCount}`);
  console.log(`   Options: ${optionCount}`);
  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📝 Default Login Credentials:');
  console.log('   Admin:');
  console.log('     Email: admin@quiz.com');
  console.log('     Password: admin123');
  console.log('   Participants:');
  console.log('     Email: john@quiz.com or jane@quiz.com');
  console.log('     Password: user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


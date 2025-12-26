import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import prisma from '../config/database.js';

/**
 * Parse CSV/XLSX file and validate question data
 * Expected format:
 * Question Text, Question Type, Options, Correct Answer, Complexity Level, Subject
 */
async function parseAndValidateQuestions(filePath, fileType) {
  const questions = [];
  const errors = [];

  try {
    let rows = [];

    if (fileType === 'csv') {
      rows = await parseCSV(filePath);
    } else if (fileType === 'xlsx') {
      rows = await parseXLSX(filePath);
    } else {
      throw new Error('Unsupported file type');
    }

    // Validate and process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header and 1-indexed

      try {
        // Validate required fields
        if (!row['Question Text'] || !row['Question Type'] || 
            !row['Correct Answer'] || !row['Complexity Level']) {
          errors.push(`Row ${rowNum}: Missing required fields`);
          continue;
        }

        // Validate question type
        const questionType = row['Question Type'].toLowerCase().trim();
        if (!['objective', 'fill_blank', 'fill in the blanks'].includes(questionType)) {
          errors.push(`Row ${rowNum}: Invalid question type. Must be 'objective' or 'fill_blank'`);
          continue;
        }

        // Validate complexity
        const complexity = row['Complexity Level'].toLowerCase().trim();
        if (!['easy', 'moderate', 'complex'].includes(complexity)) {
          errors.push(`Row ${rowNum}: Invalid complexity. Must be 'easy', 'moderate', or 'complex'`);
          continue;
        }

        // For objective questions, validate options
        let options = [];
        if (questionType === 'objective' || questionType === 'fill_blank') {
          if (questionType === 'objective') {
            const optionsText = row['Options'];
            if (!optionsText) {
              errors.push(`Row ${rowNum}: Options required for objective questions`);
              continue;
            }

            // Parse options (format: "A: Option1, B: Option2, C: Option3, D: Option4")
            options = parseOptions(optionsText);
            if (options.length < 2) {
              errors.push(`Row ${rowNum}: At least 2 options required`);
              continue;
            }
          }
        }

        questions.push({
          questionText: row['Question Text'].trim(),
          questionType: questionType === 'fill in the blanks' ? 'fill_blank' : questionType,
          complexityLevel: complexity,
          correctAnswer: row['Correct Answer'].trim(),
          subject: row['Subject'] ? row['Subject'].trim() : null,
          options: options
        });
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return { questions, errors };
  } catch (error) {
    throw new Error(`File parsing error: ${error.message}`);
  }
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function parseXLSX(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
}

function parseOptions(optionsText) {
  const options = [];
  // Handle format: "A: Option1, B: Option2" or "A. Option1, B. Option2"
  const regex = /([A-Z])[:.]\s*([^,]+)/g;
  let match;

  while ((match = regex.exec(optionsText)) !== null) {
    options.push({
      letter: match[1],
      text: match[2].trim()
    });
  }

  return options;
}

async function bulkInsertQuestions(questions) {
  const inserted = [];

  for (const q of questions) {
    const question = await prisma.question.create({
      data: {
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
      },
      include: { options: true }
    });

    inserted.push(question);
  }

  return inserted;
}

export { parseAndValidateQuestions, bulkInsertQuestions };


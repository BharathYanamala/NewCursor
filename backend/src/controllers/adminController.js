const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseAndValidateQuestions, bulkInsertQuestions } = require('../services/csvParser');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `questions-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and XLSX files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadMiddleware = upload.single('questionsFile');

// Upload questions from file
async function uploadQuestions(req, res) {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileType = fileExt === '.csv' ? 'csv' : 'xlsx';

      // Parse and validate
      const { questions, errors } = await parseAndValidateQuestions(req.file.path, fileType);

      if (errors.length > 0) {
        // Clean up file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: 'Validation errors found',
          errors: errors,
          validQuestions: questions.length
        });
      }

      if (questions.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'No valid questions found in file' });
      }

      // Bulk insert
      const inserted = await bulkInsertQuestions(questions);

      // Clean up file
      fs.unlinkSync(req.file.path);

      res.json({
        message: 'Questions uploaded successfully',
        count: inserted.length,
        questions: inserted.map(q => ({
          id: q.id,
          questionText: q.questionText,
          type: q.questionType,
          complexity: q.complexityLevel
        }))
      });
    } catch (error) {
      // Clean up file on error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
  });
}

module.exports = { uploadQuestions };


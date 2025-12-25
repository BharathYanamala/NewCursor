const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { uploadQuestions } = require('../controllers/adminController');

router.post('/upload-questions', 
  authenticateToken, 
  checkRole('admin'), 
  uploadQuestions
);

module.exports = router;


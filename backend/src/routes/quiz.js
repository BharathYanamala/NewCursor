const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { startQuiz, submitQuiz } = require('../controllers/quizController');

router.post('/start', authenticateToken, startQuiz);
router.post('/submit', authenticateToken, submitQuiz);

module.exports = router;


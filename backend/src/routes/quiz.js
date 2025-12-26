import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth.js';
import { startQuiz, submitQuiz, quitQuiz } from '../controllers/quizController.js';

router.post('/start', authenticateToken, startQuiz);
router.post('/submit', authenticateToken, submitQuiz);
router.post('/quit', authenticateToken, quitQuiz);

export default router;


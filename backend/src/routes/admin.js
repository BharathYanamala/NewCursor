import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { uploadQuestions } from '../controllers/adminController.js';

router.post('/upload-questions', 
  authenticateToken, 
  checkRole('admin'), 
  uploadQuestions
);

export default router;


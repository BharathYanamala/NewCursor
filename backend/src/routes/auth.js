import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth.js';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword,
  validateToken,
  registerValidation, 
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../controllers/authController.js';

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/validate', authenticateToken, validateToken);

export default router;


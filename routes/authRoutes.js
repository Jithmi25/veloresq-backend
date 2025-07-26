import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin, handleValidationErrors } from '../middleware/validation.js';
import {register,login,getCurrentUser,logout,forgotPassword,resetPassword,verifyEmail} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);

export default router;

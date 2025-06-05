import express from 'express';
import { registerUser, loginUser } from '../controllers/userController.js';
import { protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protectUser, (req, res) => {
  res.json({ message: `Hello ${req.user.name}, welcome to your dashboard.` });
});

export default router;

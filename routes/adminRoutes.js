import express from 'express';
import { getUsers, getGarages } from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/users', protect, isAdmin, getUsers);
router.get('/garages', protect, isAdmin, getGarages);

export default router;
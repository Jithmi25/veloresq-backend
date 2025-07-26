import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validatePagination, handleValidationErrors } from '../middleware/validation.js';
import {getProfile,updateProfile,changePassword,updateSubscription,deactivateAccount,getAllUsers,getUserById,updateUser,deleteUser} from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/subscription', protect, updateSubscription);
router.put('/deactivate', protect, deactivateAccount);

router.get('/', protect, restrictTo('admin'), validatePagination, handleValidationErrors, getAllUsers);
router.get('/:id', protect, restrictTo('admin'), getUserById);
router.put('/:id', protect, restrictTo('admin'), updateUser);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);
export default router;
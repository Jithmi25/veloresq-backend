import express from 'express';
import { getEmergencies,getEmergencyById,createEmergency,updateEmergencyStatus,cancelEmergency,getNearbyEmergencies,} from '../controllers/emergencyController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validateEmergency,validatePagination,handleValidationErrors} from '../middleware/validation.js';

const router = express.Router();

router.get('/', protect, validatePagination, handleValidationErrors, getEmergencies);
router.get('/:id', protect, getEmergencyById);
router.post('/', protect, restrictTo('customer'), validateEmergency, handleValidationErrors, createEmergency);
router.put('/:id/status', protect, restrictTo('admin'), updateEmergencyStatus);
router.put('/:id/cancel', protect, cancelEmergency);
router.get('/nearby', protect, restrictTo('admin'), getNearbyEmergencies);

export default router;

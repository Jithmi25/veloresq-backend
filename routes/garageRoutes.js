import express from 'express';
import {createGarage,getAllGarages,getGarageById,updateGarage,deleteGarage} from '../controllers/garageController.js';

import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllGarages);
router.get('/:id', getGarageById);

router.post('/', protect, restrictTo('admin', 'manager'), createGarage);

router.put('/:id', protect, restrictTo('admin', 'manager'), updateGarage);
router.delete('/:id', protect, restrictTo('admin', 'manager'), deleteGarage);

export default router;

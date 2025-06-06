import express from 'express';
import { addGarage, getNearbyGarages, updateQueue } from '../controllers/garageController.js';

const router = express.Router();

router.post('/', addGarage);
router.get('/nearby', getNearbyGarages);
router.put('/:id/queue', updateQueue);

export default router;
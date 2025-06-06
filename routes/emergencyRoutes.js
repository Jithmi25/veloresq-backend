import express from 'express';
import { createEmergencyRequest } from '../controllers/emergencyController.js';

const router = express.Router();

router.post('/request', createEmergencyRequest);

export default router;
import express from 'express';
import { registerGarage, loginGarage } from '../controllers/garageController.js';

const router = express.Router();

router.post('/register', registerGarage);
router.post('/login', loginGarage);

export default router;

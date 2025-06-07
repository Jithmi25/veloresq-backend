import express from 'express';
import multer from 'multer';
import { diagnoseSound } from '../controllers/aiController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/sound-diagnosis', upload.single('file'), diagnoseSound);

export default router;

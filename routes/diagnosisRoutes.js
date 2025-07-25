import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {getAllDiagnoses,getDiagnosisById,uploadDiagnosisAudio,getDiagnosisResult,addDiagnosisFeedback,deleteDiagnosis,getDiagnosisStats} from '../controllers/diagnosisController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { validatePagination, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Multer storage for audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/audio';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  }
});

router.get('/', protect, validatePagination, handleValidationErrors, getAllDiagnoses);
router.get('/:id', protect, getDiagnosisById);
router.post('/upload', protect, restrictTo('customer'), upload.single('audio'), uploadDiagnosisAudio);
router.get('/:id/result', protect, getDiagnosisResult);
router.put('/:id/feedback', protect, restrictTo('customer'), addDiagnosisFeedback);
router.delete('/:id', protect, deleteDiagnosis);
router.get('/stats', protect, restrictTo('admin'), getDiagnosisStats);

export default router;

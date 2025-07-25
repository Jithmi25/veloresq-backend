import fs from 'fs';
import Diagnosis from '../models/Diagnosis.js';

export const getAllDiagnoses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    }

    if (req.query.status) {
      query.analysisStatus = req.query.status;
    }

    if (req.query.severity) {
      query.severity = req.query.severity;
    }

    const diagnoses = await Diagnosis.find(query)
      .populate('customerId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Diagnosis.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        diagnoses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get diagnoses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDiagnosisById = async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id)
      .populate('customerId', 'firstName lastName email phoneNumber')
      .populate('followUpBooking');

    if (!diagnosis) {
      return res.status(404).json({ success: false, message: 'Diagnosis not found' });
    }

    if (req.user.role === 'customer' && diagnosis.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: { diagnosis } });
  } catch (error) {
    console.error('Get diagnosis error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const uploadDiagnosisAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required' });
    }

    const { vehicleInfo, symptoms, drivingConditions, whenOccurs } = req.body;

    let parsedVehicleInfo = {};
    if (vehicleInfo) {
      try {
        parsedVehicleInfo = typeof vehicleInfo === 'string' ? JSON.parse(vehicleInfo) : vehicleInfo;
      } catch (error) {
        console.error('Error parsing vehicle info:', error);
      }
    }

    const diagnosis = await Diagnosis.create({
      customerId: req.user._id,
      audioFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      },
      vehicleInfo: parsedVehicleInfo,
      symptoms,
      drivingConditions,
      whenOccurs,
      analysisStatus: 'pending'
    });

    setTimeout(async () => {
      try {
        await simulateAIAnalysis(diagnosis._id);
      } catch (error) {
        console.error('AI analysis simulation error:', error);
      }
    }, 5000);

    res.status(201).json({
      success: true,
      data: {
        diagnosisId: diagnosis._id,
        message: 'Audio uploaded successfully. Analysis in progress.'
      }
    });
  } catch (error) {
    console.error('Upload audio error:', error);

    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
};

export const getDiagnosisResult = async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id)
      .populate('customerId', 'firstName lastName');

    if (!diagnosis) {
      return res.status(404).json({ success: false, message: 'Diagnosis not found' });
    }

    if (req.user.role === 'customer' && diagnosis.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (['pending', 'processing'].includes(diagnosis.analysisStatus)) {
      return res.status(202).json({
        success: true,
        message: 'Analysis in progress',
        data: { status: diagnosis.analysisStatus, diagnosisId: diagnosis._id }
      });
    }

    if (diagnosis.analysisStatus === 'failed') {
      return res.status(500).json({
        success: false,
        message: 'Analysis failed',
        data: { errorMessage: diagnosis.errorMessage, errorCode: diagnosis.errorCode }
      });
    }

    res.status(200).json({ success: true, data: { diagnosis } });
  } catch (error) {
    console.error('Get diagnosis result error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addDiagnosisFeedback = async (req, res) => {
  try {
    const { wasAccurate, rating, comments } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    let diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) return res.status(404).json({ success: false, message: 'Diagnosis not found' });

    if (diagnosis.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (diagnosis.analysisStatus !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only provide feedback for completed diagnoses' });
    }

    diagnosis.customerFeedback = { wasAccurate, rating, comments };
    await diagnosis.save();

    res.status(200).json({ success: true, data: { diagnosis } });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteDiagnosis = async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) return res.status(404).json({ success: false, message: 'Diagnosis not found' });

    if (req.user.role === 'customer' && diagnosis.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (diagnosis.audioFile?.path) {
      fs.unlink(diagnosis.audioFile.path, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });
    }

    await Diagnosis.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Diagnosis deleted successfully' });
  } catch (error) {
    console.error('Delete diagnosis error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDiagnosisStats = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const stats = await Diagnosis.getStats(startDate, endDate);

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        stats
      }
    });
  } catch (error) {
    console.error('Get diagnosis stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Simulated AI analysis logic
async function simulateAIAnalysis(diagnosisId) {
  try {
    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis) return;

    diagnosis.analysisStatus = 'processing';
    await diagnosis.save();

    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockResults = [
      {
        confidence: 87,
        issue: 'Engine Belt Issues',
        severity: 'medium',
        description: 'Worn or loose serpentine belt.',
        recommendations: ['Inspect belt', 'Replace if needed'],
        estimatedCost: { min: 3500, max: 8500 },
        urgency: 'within_week'
      },
      {
        confidence: 92,
        issue: 'Brake Pad Wear',
        severity: 'high',
        description: 'Brake pads are worn out.',
        recommendations: ['Replace pads', 'Check discs'],
        estimatedCost: { min: 8000, max: 15000 },
        urgency: 'immediate'
      }
    ];

    const result = mockResults[Math.floor(Math.random() * mockResults.length)];

    Object.assign(diagnosis, {
      analysisStatus: 'completed',
      ...result,
      modelVersion: 'v1.0.0',
      processingTime: 8000
    });

    await diagnosis.save();
  } catch (error) {
    console.error('AI analysis error:', error);
    await Diagnosis.findByIdAndUpdate(diagnosisId, {
      analysisStatus: 'failed',
      errorMessage: 'AI analysis failed',
      errorCode: 'AI_ERROR'
    });
  }
}

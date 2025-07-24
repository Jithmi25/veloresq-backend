import mongoose from "mongoose";

const diagnosisSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  
  // Audio file information
  audioFile: {
    filename: {
      type: String,
      required: [true, 'Audio filename is required']
    },
    originalName: String,
    mimeType: String,
    size: Number,
    path: String
  },
  
  // Vehicle information
  vehicleInfo: {
    make: String,
    model: String,
    year: Number,
    mileage: Number,
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'hybrid', 'electric']
    }
  },
  
  // Symptoms and context
  symptoms: {
    type: String,
    maxlength: [1000, 'Symptoms description cannot exceed 1000 characters']
  },
  drivingConditions: String,
  whenOccurs: String,
  
  // AI Analysis Results
  analysisStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Diagnosis results
  confidence: {
    type: Number,
    min: [0, 'Confidence cannot be less than 0'],
    max: [100, 'Confidence cannot exceed 100']
  },
  issue: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  },
  description: String,
  
  // Recommendations
  recommendations: [String],
  urgency: {
    type: String,
    enum: ['immediate', 'within_week', 'within_month', 'routine'],
    default: 'routine'
  },
  
  // Cost estimation
  estimatedCost: {
    min: {
      type: Number,
      min: [0, 'Minimum cost cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum cost cannot be negative']
    },
    currency: {
      type: String,
      default: 'LKR'
    }
  },
  
  // Related services
  suggestedServices: [{
    name: String,
    description: String,
    estimatedPrice: Number,
    estimatedDuration: Number
  }],
  
  // AI model information
  modelVersion: String,
  processingTime: Number, 
  
  // Follow-up
  followUpBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  
  // Feedback
  customerFeedback: {
    wasAccurate: Boolean,
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comments: String
  },
  
  // Internal notes
  adminNotes: String,
  
  // Error information 
  errorMessage: String,
  errorCode: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
diagnosisSchema.index({ customerId: 1 });
diagnosisSchema.index({ analysisStatus: 1 });
diagnosisSchema.index({ createdAt: -1 });
diagnosisSchema.index({ severity: 1 });

// Virtual for diagnosis reference number
diagnosisSchema.virtual('referenceNumber').get(function() {
  return `DGN-${this.createdAt.getFullYear()}-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Method to get audio file URL
diagnosisSchema.methods.getAudioUrl = function() {
  if (this.audioFile && this.audioFile.path) {
    return `/uploads/audio/${this.audioFile.filename}`;
  }
  return null;
};

// Static method to get diagnosis statistics
diagnosisSchema.statics.getStats = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalDiagnoses: { $sum: 1 },
        completedDiagnoses: {
          $sum: { $cond: [{ $eq: ['$analysisStatus', 'completed'] }, 1, 0] }
        },
        averageConfidence: { $avg: '$confidence' },
        severityBreakdown: {
          $push: '$severity'
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalDiagnoses: 0,
    completedDiagnoses: 0,
    averageConfidence: 0,
    severityBreakdown: []
  };
};

export default mongoose.model("Diagnosis", diagnosisSchema);

import mongoose from 'mongoose';

const vehicleInfoSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: [1900, 'Invalid vehicle year'],
    max: [new Date().getFullYear() + 1, 'Invalid vehicle year']
  },
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    trim: true,
    uppercase: true
  },
  color: {
    type: String,
    trim: true
  }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required:true 
  },
  garageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Garage',
    required:true  
  },
  serviceId: {
    type: String,
    required: true
  },
  scheduledDateTime: {
    type: Date,
    required: [true, 'Scheduled date and time is required']
  },
  actualStartTime: Date,
  actualEndTime: Date,
  status: {
     type: String, 
     enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'], 
     default: 'pending' 
  },
  vehicleInfo: {
    type: vehicleInfoSchema,
    required: [true, 'Vehicle information is required']
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'bank_transfer']
  },
  paymentId: String,
  customerNotes: String,
  garageNotes: String,
  customerRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  customerReview: String,
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['customer', 'garage', 'admin']
  },
  cancellationDate: Date,
  
  // Emergency booking
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyType: {
    type: String,
    enum: ['breakdown', 'accident', 'battery', 'tire', 'other']
  },
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'push']
    },
    message: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookingSchema.index({ customerId: 1 });
bookingSchema.index({ garageId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledDateTime: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for booking duration
bookingSchema.virtual('duration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); 
  }
  return null;
});

// Virtual for booking reference number
bookingSchema.virtual('referenceNumber').get(function() {
  return `VEL-${this.createdAt.getFullYear()}-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // Set actual start time when status changes to in_progress
  if (this.isModified('status') && this.status === 'in_progress' && !this.actualStartTime) {
    this.actualStartTime = new Date();
  }
  
  // Set actual end time when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.actualEndTime) {
    this.actualEndTime = new Date();
  }
  
  next();
});

// Static method to get booking statistics
bookingSchema.statics.getStats = async function(garageId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        garageId: mongoose.Types.ObjectId(garageId),
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] }
        },
        averageRating: { $avg: '$customerRating' }
      }
    }
  ]);
  
  return stats[0] || {
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0
  };
};

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;


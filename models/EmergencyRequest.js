import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  type: {
    type: String,
    enum: ['breakdown', 'accident', 'flat_tire', 'battery', 'fuel', 'lockout', 'other'],
    required: [true, 'Emergency type is required']
  },
  description: {
    type: String,
    required: [true, 'Emergency description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
    type: [Number],
    required: true
  }},
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  status: { 
    type: String,
    enum: ['pending', 'dispatched', 'in_progress', 'completed', 'cancelled'],
    default: 'pending' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyTeam'
  },
  assignedAt: Date,
  
  // Timing
  estimatedArrival: Date,
  actualArrival: Date,
  completedAt: Date,
  
  // Vehicle information
  vehicleInfo: {
    make: String,
    model: String,
    year: Number,
    licensePlate: String,
    color: String
  },
  
  // Contact information
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required']
  },
  alternateContact: String,
  
  // Additional details
  passengerCount: {
    type: Number,
    min: [0, 'Passenger count cannot be negative'],
    default: 1
  },
  hasInjuries: {
    type: Boolean,
    default: false
  },
  weatherConditions: String,
  roadConditions: String,
  
  // Service details
  servicesProvided: [String],
  partsUsed: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  laborCost: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: String,
  
  // Feedback
  customerRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  customerFeedback: String,
  
  // Internal notes
  dispatchNotes: String,
  teamNotes: String,
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['customer', 'team', 'admin']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

emergencyRequestSchema.index({ location: '2dsphere' });
emergencyRequestSchema.index({ customerId: 1 });
emergencyRequestSchema.index({ status: 1 });
emergencyRequestSchema.index({ priority: 1 });
emergencyRequestSchema.index({ createdAt: -1 });

// Virtual for emergency reference number
emergencyRequestSchema.virtual('referenceNumber').get(function() {
  return `EMG-${this.createdAt.getFullYear()}-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Virtual for response time
emergencyRequestSchema.virtual('responseTime').get(function() {
  if (this.actualArrival && this.createdAt) {
    return Math.round((this.actualArrival - this.createdAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Method to calculate distance from emergency location
emergencyRequestSchema.methods.distanceFrom = function(lat, lng) {
  const R = 6371; 
  const dLat = (lat - this.location.coordinates[1]) * Math.PI / 180;
  const dLng = (lng - this.location.coordinates[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Pre-save middleware
emergencyRequestSchema.pre('save', function(next) {
  // Calculate total cost
  if (this.isModified('partsUsed') || this.isModified('laborCost')) {
    const partsCost = this.partsUsed.reduce((total, part) => total + (part.cost * part.quantity), 0);
    this.totalCost = partsCost + this.laborCost;
  }
  
  // Set completion time
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
export default EmergencyRequest;

import mongoose from 'mongoose';

const dayHoursSchema = new mongoose.Schema({
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
  },
  closeTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
  }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['maintenance', 'repair', 'diagnostic', 'battery', 'charging', 'emergency'],
    default: 'maintenance'
  }
}, { timestamps: true });

const garageSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true, 'Garage name is required'],
    trim: true,
    maxlength: [100, 'Garage name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] 
  },
  description: {
    type: String,
    required: [true, 'Garage description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
 city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+94\d{9}$/, 'Please enter a valid Sri Lankan phone number']
  },
 location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], 
    required: true,
    index: '2dsphere'
  }
},
 rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviewCount: {
    type: Number,
    default: 0
  },
 isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
 openingHours: {
    monday: dayHoursSchema,
    tuesday: dayHoursSchema,
    wednesday: dayHoursSchema,
    thursday: dayHoursSchema,
    friday: dayHoursSchema,
    saturday: dayHoursSchema,
    sunday: dayHoursSchema
  },
  services:[serviceSchema],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  currentQueue: {
    type: Number,
    default: 0,
    min: [0, 'Queue cannot be negative']
  },
  estimatedWaitTime: {
    type: Number,
    default: 0,
    min: [0, 'Wait time cannot be negative']
  },
  garageType: {
    type: String,
    enum: ['general', 'battery_charging', 'specialized'],
    default: 'general'
  },
  facilities: [{
    name: String,
    description: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  images: [String],
  businessLicense: String,
  taxId: String,
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    monthlyRevenue: {
      type: Number,
      default: 0
    },
    averageServiceTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

garageSchema.index({ location: '2dsphere' });
garageSchema.index({ city: 1 });
garageSchema.index({ isActive: 1 });
garageSchema.index({ rating: -1 });
garageSchema.index({ ownerId: 1 });

//for latitude
garageSchema.virtual('latitude').get(function() {
  return this.location.coordinates[1];
});
//for longitude
garageSchema.virtual('longitude').get(function() {
  return this.location.coordinates[0];
});

// Method to calculate distance from a point
garageSchema.methods.distanceFrom = function(lat, lng) {
  const R = 6371; 
  const dLat = (lat - this.latitude) * Math.PI / 180;
  const dLng = (lng - this.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Method to check if garage is currently open
garageSchema.methods.isCurrentlyOpen = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().substring(0, 3); 
  const currentTime = now.toTimeString().substring(0, 5); 
  
  const daySchedule = this.openingHours[day + 'day'];
  if (!daySchedule || !daySchedule.isOpen) return false;
  
  return currentTime >= daySchedule.openTime && currentTime <= daySchedule.closeTime;
};


const Garage = mongoose.model('Garage', garageSchema);
export default Garage;

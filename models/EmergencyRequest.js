import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    address: String
  },
  status: { 
    type: String,
    enum: ['open', 'assigned', 'closed'], 
    default: 'open' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now }
});

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
export default EmergencyRequest;

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
  },
  garageId: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Garage' 
  },
  time: Date,
  status: {
     type: String, 
     enum: ['pending', 'confirmed', 'completed'], 
     default: 'pending' 
  },
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;


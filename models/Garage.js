import mongoose from 'mongoose';

const garageSchema = new mongoose.Schema({
  name:{
    type: String,
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password:{
    type: String,
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
  },
  address: {
    type: String,
    required: true
  }
},
  services:{
    type: [String],
    }
});

const Garage = mongoose.model('Garage', garageSchema);
export default Garage;

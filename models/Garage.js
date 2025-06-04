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
    type:String,
  },
    services:{
        type: [String],
    }
});

const Garage = mongoose.model('Garage', garageSchema);
export default Garage;

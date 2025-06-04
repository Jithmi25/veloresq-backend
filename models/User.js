import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name:{
    type: String,
  },  
  email: { 
    type: String, 
    required:true,
    unique: true
  },
  password:{
    type: String,
  },  
  role: { 
    type: String, 
    enum: ['driver', 'garage_owner', 'admin'], 
    default: 'driver'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;

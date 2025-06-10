import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, ref: "User" 
},
  garageId: { 
    type: mongoose.Schema.Types.ObjectId, ref: "Garage", default: null 
},
  amount: Number,
  type: String, 
  status: String, 
  reference: String, 
  createdAt: {
     type: Date,
    default: Date.now
 },
});

export default mongoose.model("Transaction", transactionSchema);

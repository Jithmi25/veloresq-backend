import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import garageRoutes from './routes/garageRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/garages', garageRoutes);

connectDB();

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
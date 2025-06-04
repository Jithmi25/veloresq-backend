import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Garage from '../models/Garage.js';

export const registerGarage = async (req, res) => {
  const { name, email, password, location, services } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const newGarage = new Garage({ name, email, password: hashed, location, services });
    await newGarage.save();
    res.status(201).json({ message: 'Garage registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginGarage = async (req, res) => {
  const { email, password } = req.body;
  try {
    const garage = await Garage.findOne({ email });
    if (!garage) return res.status(404).json({ error: 'Garage not found' });

    const match = await bcrypt.compare(password, garage.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: garage._id }, process.env.JWT_SECRET);
    res.json({ token, garage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

import User from '../models/User.js';
import Garage from '../models/Garage.js';

export const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

export const getGarages = async (req, res) => {
  const garages = await Garage.find();
  res.json(garages);
};
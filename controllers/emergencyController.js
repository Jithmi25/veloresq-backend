import EmergencyRequest from '../models/EmergencyRequest.js';

export const createEmergencyRequest = async (req, res) => {
  const { userId, location } = req.body;
  const request = new EmergencyRequest({ userId, location });
  await request.save();
  res.status(201).json(request);
};
import Garage from '../models/Garage.js';

export const addGarage = async (req, res) => {
  const { name, email, password, location, services } = req.body;
  try {
    const garage = new Garage({ name, email, password, location, services });
    await garage.save();
    res.status(201).json(garage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getNearbyGarages = async (req, res) => {
  const { lat, lng } = req.query;
  const garages = await Garage.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: 5000
      }
    }
  });
  res.json(garages);
};

export const updateQueue = async (req, res) => {
  const { id } = req.params;
  const { queueLength, status } = req.body;
  const updated = await Garage.findByIdAndUpdate(id, { queueLength, status }, { new: true });
  res.json(updated);
};
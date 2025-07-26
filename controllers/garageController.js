import Garage from '../models/Garage.js';
import Booking from '../models/Booking.js';

export const getAllGarages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    if (req.query.latitude && req.query.longitude) {
      const radius = parseFloat(req.query.radius) || 10;
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(req.query.longitude), parseFloat(req.query.latitude)]
          },
          $maxDistance: radius * 1000
        }
      };
    }

    if (req.query.minRating) {
      query.rating = { $gte: parseFloat(req.query.minRating) };
    }

    if (req.query.city) {
      query.city = new RegExp(req.query.city, 'i');
    }

    if (req.query.services) {
      const services = req.query.services.split(',');
      query['services.name'] = { $in: services.map(s => new RegExp(s, 'i')) };
    }

    if (req.query.search) {
      query.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
        { city: new RegExp(req.query.search, 'i') }
      ];
    }

    const garages = await Garage.find(query)
      .populate('ownerId', 'firstName lastName email phoneNumber')
      .sort({ rating: -1, reviewCount: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Garage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        garages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get garages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getGarageById = async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id).populate(
      'ownerId',
      'firstName lastName email phoneNumber'
    );

    if (!garage) {
      return res.status(404).json({ success: false, message: 'Garage not found' });
    }

    res.status(200).json({ success: true, data: garage });
  } catch (error) {
    console.error('Get garage by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createGarage = async (req, res) => {
  try {
    const { name, description, city, location, services } = req.body;

    const newGarage = new Garage({
      ownerId: req.user._id,
      name,
      description,
      city,
      location,
      services
    });

    const garage = await newGarage.save();

    res.status(201).json({ success: true, data: garage });
  } catch (error) {
    console.error('Create garage error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateGarage = async (req, res) => {
  try {
    const updates = req.body;

    const garage = await Garage.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      updates,
      { new: true }
    );

    if (!garage) {
      return res.status(404).json({ success: false, message: 'Garage not found or unauthorized' });
    }

    res.status(200).json({ success: true, data: garage });
  } catch (error) {
    console.error('Update garage error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteGarage = async (req, res) => {
  try {
    const garage = await Garage.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!garage) {
      return res.status(404).json({ success: false, message: 'Garage not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Garage deleted successfully' });
  } catch (error) {
    console.error('Delete garage error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getGarageBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ garageId: req.params.id })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get garage bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

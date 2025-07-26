import EmergencyRequest from '../models/EmergencyRequest.js';

export const getEmergencies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;

    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
    }

    const emergencies = await EmergencyRequest.find(query)
      .populate('customerId', 'firstName lastName phoneNumber')
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EmergencyRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        emergencies,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get emergency requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getEmergencyById = async (req, res) => {
  try {
    const emergency = await EmergencyRequest.findById(req.params.id)
      .populate('customerId', 'firstName lastName email phoneNumber');

    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency request not found' });

    if (req.user.role === 'customer' && emergency.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: { emergency } });
  } catch (error) {
    console.error('Get emergency request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createEmergency = async (req, res) => {
  try {
    const {
      type,
      description,
      location,
      vehicleInfo,
      contactNumber,
      passengerCount,
      hasInjuries,
    } = req.body;

    let priority = 'medium';
    if (hasInjuries || type === 'accident') priority = 'critical';
    else if (type === 'breakdown' || type === 'battery') priority = 'high';
    else if (type === 'flat_tire' || type === 'fuel') priority = 'medium';
    else priority = 'low';

    const emergency = await EmergencyRequest.create({
      customerId: req.user._id,
      type,
      description,
      location: { type: 'Point', coordinates: [location.longitude, location.latitude] },
      address: location.address,
      vehicleInfo,
      contactNumber,
      passengerCount,
      hasInjuries,
      priority,
    });

    await emergency.populate('customerId', 'firstName lastName email phoneNumber');

    res.status(201).json({ success: true, data: { emergency } });
  } catch (error) {
    console.error('Create emergency request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateEmergencyStatus = async (req, res) => {
  try {
    const { status, dispatchNotes, estimatedArrival } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const validStatuses = ['pending', 'dispatched', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const emergency = await EmergencyRequest.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency request not found' });

    emergency.status = status;
    if (dispatchNotes) emergency.dispatchNotes = dispatchNotes;
    if (estimatedArrival) emergency.estimatedArrival = new Date(estimatedArrival);
    if (status === 'dispatched' && !emergency.assignedAt) emergency.assignedAt = new Date();
    if (status === 'in_progress' && !emergency.actualArrival) emergency.actualArrival = new Date();

    await emergency.save();
    await emergency.populate('customerId', 'firstName lastName email phoneNumber');

    res.status(200).json({ success: true, data: { emergency } });
  } catch (error) {
    console.error('Update emergency status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const cancelEmergency = async (req, res) => {
  try {
    const { reason } = req.body;
    const emergency = await EmergencyRequest.findById(req.params.id);

    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency request not found' });

    if (req.user.role === 'customer' && emergency.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (['cancelled', 'completed'].includes(emergency.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel emergency in current state' });
    }

    emergency.status = 'cancelled';
    emergency.cancellationReason = reason;
    emergency.cancelledBy = req.user.role === 'admin' ? 'admin' : 'customer';

    await emergency.save();
    await emergency.populate('customerId', 'firstName lastName email phoneNumber');

    res.status(200).json({ success: true, data: { emergency } });
  } catch (error) {
    console.error('Cancel emergency request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getNearbyEmergencies = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const emergencies = await EmergencyRequest.find({
      status: { $in: ['pending', 'dispatched'] },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseFloat(radius) * 1000,
        },
      },
    })
      .populate('customerId', 'firstName lastName phoneNumber')
      .sort({ priority: 1, createdAt: 1 });

    res.status(200).json({ success: true, data: { emergencies } });
  } catch (error) {
    console.error('Get nearby emergencies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

import Booking from '../models/Booking.js';

export const createBooking = async (req, res) => {
  const { userId, garageId, time } = req.body;
  const booking = new Booking({ userId, garageId, time });
  await booking.save();
  res.status(201).json(booking);
};

export const getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ userId: req.params.id });
  res.json(bookings);
};
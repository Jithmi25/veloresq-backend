import Booking from '../models/Booking.js';
import asyncHandler from 'express-async-handler';

export const createBooking = asyncHandler(async (req, res) => {
  const booking = new Booking(req.body);
  const savedBooking = await booking.save();
  res.status(201).json(savedBooking);
});

export const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find().populate('customerId');
  res.json(bookings);
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('customerId');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  res.json(booking);
});

export const updateBooking = asyncHandler(async (req, res) => {
  const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) {
    res.status(404);
    throw new Error('Booking not found');
  }
  res.json(updated);
});

export const deleteBooking = asyncHandler(async (req, res) => {
  const deleted = await Booking.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error('Booking not found');
  }
  res.json({ message: 'Booking deleted successfully' });
});

import express from 'express';
import { createBooking, getBookings,getBookingById,updateBooking,deleteBooking } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', createBooking);
router.get('/', getBookings);

router.get('/:id',getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;
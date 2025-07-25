import express from 'express';
import { createBooking, getBookings,getBookingById,updateBooking,deleteBooking } from '../controllers/bookingController.js';

const router = express.Router();

router.route('/')
  .post(createBooking)   
  .get(getBookings);     

router.route('/:id')
  .get(getBookingById)   
  .put(updateBooking)    
  .delete(deleteBooking);


export default router;
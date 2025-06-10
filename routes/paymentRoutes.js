import express from "express";
import { initiatePayment, paymentCallback } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/initiate", initiatePayment);
router.post("/callback", paymentCallback); 

export default router;

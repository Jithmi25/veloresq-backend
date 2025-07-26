import axios from "axios";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Garage from "../models/Garage.js";

// Initiate Payment
export const initiatePayment = async (req, res) => {
  try {
    const { customerId, garageId, amount, type } = req.body;

    const booking = new Booking({
      customerId,
      garageId,
      amount,
      type,
      status: "pending",
    });

    await booking.save();

    const payHereForm = {
      merchant_id: "YOUR_MERCHANT_ID",
      return_url: "https://yourdomain.com/success",
      cancel_url: "https://yourdomain.com/cancel",
      notify_url: "https://your-backend.com/api/payments/callback",
      order_id: booking._id,
      items: `${type} Plan`,
      amount: amount,
      currency: "LKR",
      first_name: "Demo",
      last_name: "User",
      email: "demo@example.com",
      phone: "0771234567",
      address: "Colombo",
      city: "Colombo",
      country: "Sri Lanka",
    };

    return res.status(200).json({ payHereForm });
  } catch (error) {
    console.error("Payment initiation failed:", error);
    res.status(500).json({ error: "Payment initiation error" });
  }
};

// Payment Callback
export const paymentCallback = async (req, res) => {
  try {
    const { order_id, status_code } = req.body;

    const booking = await Booking.findById(order_id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.status = status_code === "2" ? "success" : "failed";
    await booking.save();

    // Update premium or featured status
    if (booking.status === "success") {
      if (booking.type === "premium") {
        const user = await User.findById(booking.customerId);
        if (user) {
          user.premium = true;
          await user.save();
        }
      } else if (booking.type === "subscription") {
        const garage = await Garage.findById(booking.garageId);
        if (garage) {
          garage.featured = true;
          await garage.save();
        }
      }
    }

    res.status(200).send("Callback processed");
  } catch (error) {
    console.error("Payment callback failed:", error);
    res.status(500).json({ error: "Payment callback error" });
  }
};

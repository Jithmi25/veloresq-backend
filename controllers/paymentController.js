import Transaction from "../models/Transaction.js";
import axios from "axios";

export const initiatePayment = async (req, res) => {
  const { userId, amount, type } = req.body;

  const transaction = new Transaction({
    userId,
    amount,
    type,
    status: "pending",
  });

  await transaction.save();

  const payHereForm = {
    merchant_id: "YOUR_MERCHANT_ID",
    return_url: "https://yourdomain.com/success",
    cancel_url: "https://yourdomain.com/cancel",
    notify_url: "https://your-backend.com/api/payments/callback",
    order_id: transaction._id,
    items: type + " Plan",
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
};

export const paymentCallback = async (req, res) => {
  try {
    const { order_id, status_code } = req.body;

    const transaction = await Transaction.findById(order_id);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    transaction.status = status_code === "2" ? "success" : "failed";
    await transaction.save();

    // Mark user or garage as premium/featured
    if (transaction.status === "success") {
      if (transaction.type === "premium") {
        const user = await User.findById(transaction.userId);
        user.premium = true;
        await user.save();
      } else if (transaction.type === "subscription") {
        const garage = await Garage.findById(transaction.garageId);
        garage.featured = true;
        await garage.save();
      }
    }

    res.status(200).send("Callback processed");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Payment callback error" });
  }
};


import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Garage from "../models/Garage.js";

export const protectUser = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token, access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid" });
  }
};

export const protectGarage = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token, access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.garage = await Garage.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid" });
  }
};

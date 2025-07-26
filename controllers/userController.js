import User from '../models/User.js';
import { validationResult } from 'express-validator';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phoneNumber'];
    if (req.user.role === 'garage_owner') {
      allowedFields.push('garageName', 'garageAddress', 'businessLicense');
    }
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Invalid password input' });
    }
    const user = await User.findById(req.user._id).select('+password');
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { planType, autoRenew } = req.body;
    const validPlans = ['basic', 'premium', 'pro', 'garage_basic', 'garage_pro'];
    if (planType && !validPlans.includes(planType)) {
      return res.status(400).json({ success: false, message: 'Invalid plan type' });
    }
    const updateData = {};
    if (planType) {
      updateData['subscription.planType'] = planType;
      updateData['subscription.startDate'] = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      updateData['subscription.endDate'] = endDate;
    }
    if (autoRenew !== undefined) {
      updateData['subscription.autoRenew'] = autoRenew;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deactivateAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.status(200).json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    if (req.query.isVerified !== undefined) query.isVerified = req.query.isVerified === 'true';
    if (req.query.search) {
      query.$or = [
        { firstName: new RegExp(req.query.search, 'i') },
        { lastName: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { garageName: new RegExp(req.query.search, 'i') }
      ];
    }
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await User.countDocuments(query);
    res.status(200).json({ success: true, data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'phoneNumber', 'role', 
      'isVerified', 'isActive', 'garageName', 'garageAddress', 
      'businessLicense'
    ];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


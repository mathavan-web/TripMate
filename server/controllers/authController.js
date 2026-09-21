const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BusinessProfile = require('../models/BusinessProfile');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const registerUser = async (req, res) => {
  const { name, email, phone, password, confirmPassword, businessName, role } = req.body;

  if (!name || !email || !phone || !password || !confirmPassword || !businessName) {
    return errorResponse(res, 400, 'Please fill in all required fields');
  }

  if (password.length < 6) {
    return errorResponse(res, 400, 'Password must be at least 6 characters');
  }

  if (password !== confirmPassword) {
    return errorResponse(res, 400, 'Passwords do not match');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return errorResponse(res, 400, 'User already exists with this email');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    role: role || 'Driver',
  });

  const businessProfile = await BusinessProfile.create({
    user: user._id,
    businessName,
    ownerName: name,
    phone,
    email: email.toLowerCase(),
  });

  user.business = businessProfile._id;
  await user.save();

  return successResponse(res, 201, 'Registration successful', {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    token: generateToken(user._id),
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    return errorResponse(res, 401, 'Invalid email or password');
  }

  return successResponse(res, 200, 'Login successful', {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    token: generateToken(user._id),
  });
};

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return errorResponse(res, 404, 'User not found');
  }

  return successResponse(res, 200, 'User retrieved successfully', user);
};

const logoutUser = (req, res) => {
  return successResponse(res, 200, 'Logged out successfully');
};

const updateCurrentUser = async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return errorResponse(res, 404, 'User not found');
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;

  await user.save();

  return successResponse(res, 200, 'Profile updated successfully', {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateCurrentUser,
};

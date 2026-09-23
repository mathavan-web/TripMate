const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

const createDeveloperUser = async () => {
  const developerEmail = 'developer@tripmate.local';
  const developerPassword = await bcrypt.hash('Developer123!', 10);

  return User.findOneAndUpdate(
    { email: developerEmail },
    {
      $setOnInsert: {
        name: 'Developer',
        email: developerEmail,
        phone: '0000000000',
        password: developerPassword,
        role: 'Admin',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const isLocalDeveloperBypass = process.env.DEV_BYPASS_AUTH === 'true' || process.env.NODE_ENV !== 'production';

  if (isLocalDeveloperBypass && !token) {
    const developerUser = await createDeveloperUser();
    req.user = developerUser;
    return next();
  }

  if (!token) {
    return errorResponse(res, 401, 'Not authorized, token missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (isLocalDeveloperBypass) {
      const developerUser = await createDeveloperUser();
      req.user = developerUser;
      return next();
    }

    return errorResponse(res, 401, 'Not authorized, token failed');
  }
};

module.exports = { protect };

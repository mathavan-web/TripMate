const BusinessProfile = require('../models/BusinessProfile');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getBusinessProfile = async (req, res) => {
  try {
    let profile = await BusinessProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = await BusinessProfile.create({
        user: req.user._id,
        businessName: '',
        ownerName: req.user.name,
        phone: req.user.phone,
        email: req.user.email,
      });
    }

    return successResponse(res, 200, 'Business profile fetched', profile);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch business profile');
  }
};

const upsertBusinessProfile = async (req, res) => {
  try {
    const { businessName, ownerName, phone, whatsapp, email, address, city, state, pinCode, logo, upiId, paymentInformation, termsAndConditions } = req.body;

    const profileData = {
      user: req.user._id,
      businessName,
      ownerName,
      phone,
      whatsapp,
      email,
      address,
      city,
      state,
      pinCode,
      logo,
      upiId,
      paymentInformation,
      termsAndConditions,
    };

    const profile = await BusinessProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true }
    );

    return successResponse(res, 200, 'Business profile saved successfully', profile);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to save business profile');
  }
};

module.exports = {
  getBusinessProfile,
  upsertBusinessProfile,
};

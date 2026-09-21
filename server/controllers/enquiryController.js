const Enquiry = require('../models/Enquiry');
const Customer = require('../models/Customer');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getEnquiries = async (req, res) => {
  try {
    const { status, travelType, search } = req.query;
    const filter = { createdBy: req.user._id, isArchived: false };

    if (status && status !== 'All') filter.status = status;
    if (travelType && travelType !== 'All') filter.travelType = travelType;

    if (search) {
      const customerMatches = await Customer.find({
        createdBy: req.user._id,
        $or: [
          { name: new RegExp(search.trim(), 'i') },
          { phone: new RegExp(search.trim(), 'i') },
          { email: new RegExp(search.trim(), 'i') },
        ],
      }).select('_id');

      const customerIds = customerMatches.map((customer) => customer._id);
      filter.$or = [
        { destination: new RegExp(search.trim(), 'i') },
        { pickupLocation: new RegExp(search.trim(), 'i') },
        { customer: { $in: customerIds } },
      ];
    }

    const enquiries = await Enquiry.find(filter)
      .populate('customer', 'name phone email city whatsapp')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Enquiries fetched successfully', enquiries);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch enquiries');
  }
};

const createEnquiry = async (req, res) => {
  try {
    const {
      customer,
      travelDate,
      returnDate,
      pickupLocation,
      dropLocation,
      destination,
      numberOfPassengers,
      vehiclePreference,
      travelType,
      specialRequirements,
      estimatedAmount,
      notes,
      status,
    } = req.body;

    if (!customer) {
      return errorResponse(res, 400, 'Please select a customer');
    }

    const customerExists = await Customer.findOne({ _id: customer, createdBy: req.user._id, isArchived: false });
    if (!customerExists) {
      return errorResponse(res, 404, 'Customer not found');
    }

    const enquiry = await Enquiry.create({
      customer,
      createdBy: req.user._id,
      travelDate: travelDate || null,
      returnDate: returnDate || null,
      pickupLocation: pickupLocation || '',
      dropLocation: dropLocation || '',
      destination: destination || '',
      numberOfPassengers: numberOfPassengers || 1,
      vehiclePreference: vehiclePreference || '',
      travelType: travelType || 'Local Trip',
      specialRequirements: specialRequirements || '',
      estimatedAmount: estimatedAmount || 0,
      notes: notes || '',
      status: status || 'New',
    });

    const populatedEnquiry = await Enquiry.findById(enquiry._id).populate('customer', 'name phone email city whatsapp');
    return successResponse(res, 201, 'Enquiry created successfully', populatedEnquiry);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create enquiry');
  }
};

const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findOne({ _id: req.params.id, createdBy: req.user._id, isArchived: false })
      .populate('customer', 'name phone whatsapp email address city state pinCode notes');

    if (!enquiry) {
      return errorResponse(res, 404, 'Enquiry not found');
    }

    return successResponse(res, 200, 'Enquiry fetched successfully', enquiry);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch enquiry');
  }
};

const updateEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findOne({ _id: req.params.id, createdBy: req.user._id, isArchived: false });

    if (!enquiry) {
      return errorResponse(res, 404, 'Enquiry not found');
    }

    const allowedFields = [
      'customer',
      'travelDate',
      'returnDate',
      'pickupLocation',
      'dropLocation',
      'destination',
      'numberOfPassengers',
      'vehiclePreference',
      'travelType',
      'specialRequirements',
      'estimatedAmount',
      'notes',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) enquiry[field] = req.body[field];
    });

    await enquiry.save();
    const populatedEnquiry = await Enquiry.findById(enquiry._id).populate('customer', 'name phone email city whatsapp');
    return successResponse(res, 200, 'Enquiry updated successfully', populatedEnquiry);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update enquiry');
  }
};

const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!enquiry) {
      return errorResponse(res, 404, 'Enquiry not found');
    }

    enquiry.isArchived = true;
    await enquiry.save();
    return successResponse(res, 200, 'Enquiry archived successfully', enquiry);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to archive enquiry');
  }
};

module.exports = {
  getEnquiries,
  createEnquiry,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
};

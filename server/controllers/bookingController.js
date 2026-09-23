const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Enquiry = require('../models/Enquiry');
const Quotation = require('../models/Quotation');
const Package = require('../models/Package');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateBookingNumber = async (createdBy) => {
  const count = await Booking.countDocuments({ createdBy });
  const year = new Date().getFullYear();
  return `BK-${year}-${String(count + 1).padStart(4, '0')}`;
};

const sanitizeNumber = (value, fallback = 0) => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getBookings = async (req, res) => {
  try {
    const { status, customer, search, travelDate } = req.query;
    const filter = { createdBy: req.user._id };

    if (status && status !== 'All') filter.status = status;
    if (customer && customer !== 'All') filter.customer = customer;

    if (travelDate) {
      const selectedDate = new Date(travelDate);
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      filter.travelDate = { $gte: start, $lte: end };
    }

    if (search) {
      const keyword = search.trim();
      const customerMatches = await Customer.find({
        createdBy: req.user._id,
        $or: [
          { name: new RegExp(keyword, 'i') },
          { phone: new RegExp(keyword, 'i') },
          { email: new RegExp(keyword, 'i') },
        ],
      }).select('_id');

      filter.$or = [
        { bookingNumber: new RegExp(keyword, 'i') },
        { destination: new RegExp(keyword, 'i') },
        { customer: { $in: customerMatches.map((customerDoc) => customerDoc._id) } },
      ];
    }

    const bookings = await Booking.find(filter)
      .populate('customer', 'name phone email')
      .populate('enquiry', 'destination travelDate status')
      .populate('quotation', 'quotationNumber totalAmount status')
      .populate('package', 'name packageType')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Bookings fetched successfully', bookings);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch bookings');
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      customer,
      enquiry,
      quotation,
      package: packageId,
      travelDate,
      returnDate,
      pickupLocation,
      dropLocation,
      destination,
      numberOfPassengers,
      vehicleType,
      specialRequirements,
      totalAmount,
      advanceAmount,
      status,
      notes,
    } = req.body;

    if (!customer && !quotation) {
      return errorResponse(res, 400, 'Please select a customer or accepted quotation');
    }

    const customerId = customer || (quotation ? (await Quotation.findOne({ _id: quotation, createdBy: req.user._id }).select('customer')).customer : null);
    if (!customerId) {
      return errorResponse(res, 404, 'Customer not found');
    }

    const customerExists = await Customer.findOne({ _id: customerId, createdBy: req.user._id, isArchived: false });
    if (!customerExists) {
      return errorResponse(res, 404, 'Customer not found');
    }

    if (enquiry) {
      const enquiryExists = await Enquiry.findOne({ _id: enquiry, createdBy: req.user._id, isArchived: false });
      if (!enquiryExists) {
        return errorResponse(res, 404, 'Enquiry not found');
      }
    }

    let quotationDoc = null;
    if (quotation) {
      quotationDoc = await Quotation.findOne({ _id: quotation, createdBy: req.user._id });
      if (!quotationDoc) {
        return errorResponse(res, 404, 'Quotation not found');
      }

      if (quotationDoc.status !== 'Accepted') {
        return errorResponse(res, 400, 'Only accepted quotations can be converted into bookings');
      }

      const duplicateBooking = await Booking.findOne({ createdBy: req.user._id, quotation: quotationDoc._id });
      if (duplicateBooking) {
        return errorResponse(res, 409, 'A booking already exists for this quotation');
      }
    }

    if (packageId) {
      const packageExists = await Package.findOne({ _id: packageId, createdBy: req.user._id, isActive: true });
      if (!packageExists) {
        return errorResponse(res, 404, 'Selected package is not available');
      }
    }

    if (!travelDate) {
      return errorResponse(res, 400, 'Travel date is required');
    }

    const travelDateValue = new Date(travelDate);
    if (Number.isNaN(travelDateValue.getTime())) {
      return errorResponse(res, 400, 'Travel date is invalid');
    }

    if (returnDate) {
      const returnDateValue = new Date(returnDate);
      if (Number.isNaN(returnDateValue.getTime()) || returnDateValue < travelDateValue) {
        return errorResponse(res, 400, 'Return date cannot be before the travel date');
      }
    }

    const passengerCount = Number(numberOfPassengers ?? quotationDoc?.passengers ?? 1);
    const totalValue = sanitizeNumber(totalAmount ?? quotationDoc?.totalAmount ?? 0, 0);
    const advanceValue = sanitizeNumber(advanceAmount ?? quotationDoc?.advanceAmount ?? 0, 0);

    if (passengerCount < 1) {
      return errorResponse(res, 400, 'Passenger count must be at least 1');
    }

    if (totalValue < 0 || advanceValue < 0) {
      return errorResponse(res, 400, 'Booking amounts cannot be negative');
    }

    if (advanceValue > totalValue) {
      return errorResponse(res, 400, 'Advance amount cannot exceed total amount');
    }

    const balanceAmount = Math.max(0, totalValue - advanceValue);
    const bookingNumber = await generateBookingNumber(req.user._id);

    const booking = await Booking.create({
      bookingNumber,
      customer: customerId,
      enquiry: enquiry || quotationDoc?.enquiry || null,
      quotation: quotation || null,
      package: packageId || quotationDoc?.package || null,
      travelDate: travelDateValue,
      returnDate: returnDate ? new Date(returnDate) : quotationDoc?.returnDate || null,
      pickupLocation: pickupLocation || quotationDoc?.pickupLocation || '',
      dropLocation: dropLocation || quotationDoc?.dropLocation || '',
      destination: destination || quotationDoc?.destination || '',
      numberOfPassengers: passengerCount,
      vehicleType: vehicleType || quotationDoc?.vehicleType || '',
      specialRequirements: specialRequirements || quotationDoc?.notes || '',
      totalAmount: totalValue,
      advanceAmount: advanceValue,
      balanceAmount,
      status: status || 'Pending',
      notes: notes || '',
      createdBy: req.user._id,
    });

    const populated = await Booking.findById(booking._id)
      .populate('customer', 'name phone email')
      .populate('enquiry', 'destination travelDate status')
      .populate('quotation', 'quotationNumber totalAmount status')
      .populate('package', 'name packageType');

    return successResponse(res, 201, 'Booking created successfully', populated);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create booking');
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('customer', 'name phone whatsapp email address city state pinCode')
      .populate('enquiry', 'destination pickupLocation dropLocation travelDate returnDate status')
      .populate('quotation', 'quotationNumber totalAmount advanceAmount balanceAmount status notes')
      .populate('package', 'name packageType description duration destinations vehicleType');

    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    return successResponse(res, 200, 'Booking fetched successfully', booking);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch booking');
  }
};

const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const {
      customer,
      enquiry,
      quotation,
      package: packageId,
      travelDate,
      returnDate,
      pickupLocation,
      dropLocation,
      destination,
      numberOfPassengers,
      vehicleType,
      specialRequirements,
      totalAmount,
      advanceAmount,
      status,
      notes,
    } = req.body;

    if (customer) booking.customer = customer;
    if (enquiry !== undefined) booking.enquiry = enquiry || null;
    if (quotation !== undefined) booking.quotation = quotation || null;
    if (packageId !== undefined) booking.package = packageId || null;
    if (travelDate) booking.travelDate = new Date(travelDate);
    if (returnDate !== undefined) booking.returnDate = returnDate ? new Date(returnDate) : null;
    if (pickupLocation !== undefined) booking.pickupLocation = pickupLocation;
    if (dropLocation !== undefined) booking.dropLocation = dropLocation;
    if (destination !== undefined) booking.destination = destination;
    if (numberOfPassengers !== undefined) booking.numberOfPassengers = Number(numberOfPassengers);
    if (vehicleType !== undefined) booking.vehicleType = vehicleType;
    if (specialRequirements !== undefined) booking.specialRequirements = specialRequirements;
    if (totalAmount !== undefined) booking.totalAmount = sanitizeNumber(totalAmount, 0);
    if (advanceAmount !== undefined) booking.advanceAmount = sanitizeNumber(advanceAmount, 0);
    if (status !== undefined) booking.status = status;
    if (notes !== undefined) booking.notes = notes;

    if (booking.travelDate && booking.returnDate && new Date(booking.returnDate) < new Date(booking.travelDate)) {
      return errorResponse(res, 400, 'Return date cannot be before the travel date');
    }

    if (booking.numberOfPassengers < 1) {
      return errorResponse(res, 400, 'Passenger count must be at least 1');
    }

    if (booking.totalAmount < 0 || booking.advanceAmount < 0) {
      return errorResponse(res, 400, 'Booking amounts cannot be negative');
    }

    if (booking.advanceAmount > booking.totalAmount) {
      return errorResponse(res, 400, 'Advance amount cannot exceed total amount');
    }

    booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advanceAmount);
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('customer', 'name phone email')
      .populate('enquiry', 'destination travelDate status')
      .populate('quotation', 'quotationNumber totalAmount status')
      .populate('package', 'name packageType');

    return successResponse(res, 200, 'Booking updated successfully', populated);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update booking');
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 400, 'Booking status is required');
    }

    booking.status = status;
    await booking.save();

    return successResponse(res, 200, 'Booking status updated successfully', booking);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update booking status');
  }
};

module.exports = {
  getBookings,
  createBooking,
  getBookingById,
  updateBooking,
  updateBookingStatus,
};

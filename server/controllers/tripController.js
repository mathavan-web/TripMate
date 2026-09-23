const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getTripFinancials } = require('../utils/financials');

const getTrips = async (req, res) => {
  try {
    const { status, search, travelDate } = req.query;
    const filter = { createdBy: req.user._id };

    if (status && status !== 'All') filter.status = status;

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
        ],
      }).select('_id');

      filter.$or = [
        { destination: new RegExp(keyword, 'i') },
        { driverName: new RegExp(keyword, 'i') },
        { vehicleNumber: new RegExp(keyword, 'i') },
        { customer: { $in: customerMatches.map((customerDoc) => customerDoc._id) } },
      ];
    }

    const trips = await Trip.find(filter)
      .populate('booking', 'bookingNumber status travelDate destination')
      .populate('customer', 'name phone email')
      .sort({ travelDate: 1, createdAt: -1 });

    return successResponse(res, 200, 'Trips fetched successfully', trips);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch trips');
  }
};

const createTrip = async (req, res) => {
  try {
    const {
      booking,
      customer,
      travelDate,
      returnDate,
      pickupLocation,
      dropLocation,
      destination,
      driverName,
      driverPhone,
      licenseNumber,
      vehicleModel,
      vehicleNumber,
      vehicleType,
      passengerCount,
      status,
      notes,
    } = req.body;

    if (!booking) {
      return errorResponse(res, 400, 'Booking is required');
    }

    const bookingDoc = await Booking.findOne({ _id: booking, createdBy: req.user._id });
    if (!bookingDoc) {
      return errorResponse(res, 404, 'Booking not found');
    }

    if (bookingDoc.status !== 'Confirmed') {
      return errorResponse(res, 400, 'Trips can only be created for confirmed bookings');
    }

    const customerId = customer || bookingDoc.customer;
    const customerExists = await Customer.findOne({ _id: customerId, createdBy: req.user._id, isArchived: false });
    if (!customerExists) {
      return errorResponse(res, 404, 'Customer not found');
    }

    const existingTrip = await Trip.findOne({ createdBy: req.user._id, booking: bookingDoc._id, status: { $in: ['Scheduled', 'Started'] } });
    if (existingTrip) {
      return errorResponse(res, 409, 'A scheduled or active trip already exists for this booking');
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

    const passengerTotal = Number(passengerCount ?? bookingDoc.numberOfPassengers ?? 1);
    if (passengerTotal < 1) {
      return errorResponse(res, 400, 'Passenger count must be at least 1');
    }

    const trip = await Trip.create({
      booking: bookingDoc._id,
      customer: customerId,
      travelDate: travelDateValue,
      returnDate: returnDate ? new Date(returnDate) : bookingDoc.returnDate || null,
      pickupLocation: pickupLocation || bookingDoc.pickupLocation || '',
      dropLocation: dropLocation || bookingDoc.dropLocation || '',
      destination: destination || bookingDoc.destination || '',
      driverName: driverName || '',
      driverPhone: driverPhone || '',
      licenseNumber: licenseNumber || '',
      vehicleModel: vehicleModel || '',
      vehicleNumber: vehicleNumber || '',
      vehicleType: vehicleType || bookingDoc.vehicleType || '',
      passengerCount: passengerTotal,
      status: status || 'Scheduled',
      notes: notes || '',
      createdBy: req.user._id,
    });

    const populated = await Trip.findById(trip._id)
      .populate('booking', 'bookingNumber status')
      .populate('customer', 'name phone email');

    return successResponse(res, 201, 'Trip created successfully', populated);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create trip');
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('booking', 'bookingNumber status travelDate destination pickupLocation dropLocation')
      .populate('customer', 'name phone whatsapp email address');

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }

    return successResponse(res, 200, 'Trip fetched successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch trip');
  }
};

const getTripFinancialSummary = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('booking', 'bookingNumber totalAmount status')
      .populate('customer', 'name phone email');

    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }

    const financials = await getTripFinancials(trip, req.user._id);
    const [payments, expenses] = await Promise.all([
      Payment.find({ booking: trip.booking._id, createdBy: req.user._id })
        .select('paymentNumber amount paymentDate paymentMethod paymentType')
        .sort({ paymentDate: -1 }),
      Expense.find({ trip: trip._id, createdBy: req.user._id })
        .select('expenseNumber category amount expenseDate paymentMethod')
        .sort({ expenseDate: -1 }),
    ]);

    return successResponse(res, 200, 'Trip financial summary fetched successfully', {
      trip,
      ...financials,
      payments,
      expenses,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch trip financial summary');
  }
};

const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }

    const allowedFields = [
      'customer', 'travelDate', 'returnDate', 'pickupLocation', 'dropLocation', 'destination',
      'driverName', 'driverPhone', 'licenseNumber', 'vehicleModel', 'vehicleNumber', 'vehicleType',
      'passengerCount', 'status', 'notes',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field];
      }
    });

    if (trip.travelDate && trip.returnDate && new Date(trip.returnDate) < new Date(trip.travelDate)) {
      return errorResponse(res, 400, 'Return date cannot be before the travel date');
    }

    if (trip.passengerCount < 1) {
      return errorResponse(res, 400, 'Passenger count must be at least 1');
    }

    await trip.save();

    const populated = await Trip.findById(trip._id)
      .populate('booking', 'bookingNumber status')
      .populate('customer', 'name phone email');

    return successResponse(res, 200, 'Trip updated successfully', populated);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update trip');
  }
};

const updateTripStatus = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!trip) {
      return errorResponse(res, 404, 'Trip not found');
    }

    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 400, 'Trip status is required');
    }

    trip.status = status;
    await trip.save();

    return successResponse(res, 200, 'Trip status updated successfully', trip);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update trip status');
  }
};

module.exports = {
  getTrips,
  createTrip,
  getTripById,
  getTripFinancialSummary,
  updateTrip,
  updateTripStatus,
};

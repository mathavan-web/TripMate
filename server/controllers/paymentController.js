const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Trip = require('../models/Trip');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getBookingFinancials } = require('../utils/financials');

const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];
const paymentTypes = ['Advance', 'Partial Payment', 'Final Payment', 'Refund'];

const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);
const parseAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const generatePaymentNumber = async () => {
  const count = await Payment.countDocuments();
  return `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

const validatePaymentDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date : null;
};

const resolveRelations = async (req, body) => {
  if (!body.booking || !isValidId(body.booking)) return { error: 'A valid booking is required' };

  const booking = await Booking.findOne({ _id: body.booking, createdBy: req.user._id });
  if (!booking) return { error: 'Booking not found', status: 404 };

  if (body.customer && String(body.customer) !== String(booking.customer)) {
    return { error: 'Payment customer must match the booking customer' };
  }

  if (body.trip) {
    if (!isValidId(body.trip)) return { error: 'A valid trip is required' };
    const trip = await Trip.findOne({ _id: body.trip, createdBy: req.user._id });
    if (!trip) return { error: 'Trip not found', status: 404 };
    if (String(trip.booking) !== String(booking._id)) return { error: 'Trip must belong to the selected booking' };
  }

  const customer = await Customer.findOne({ _id: booking.customer, createdBy: req.user._id, isArchived: false });
  if (!customer) return { error: 'Customer not found', status: 404 };

  return { booking, customer };
};

const validatePaymentFields = (body) => {
  const amount = parseAmount(body.amount);
  if (amount === null || amount <= 0) return 'Payment amount must be greater than zero';
  if (!paymentMethods.includes(body.paymentMethod)) return 'Payment method is invalid';
  if (!paymentTypes.includes(body.paymentType)) return 'Payment type is invalid';
  if (!validatePaymentDate(body.paymentDate)) return 'Payment date is invalid';
  return null;
};

const validatePaymentLimit = async (booking, createdBy, amount, paymentType, excludedPaymentId = null) => {
  const financials = await getBookingFinancials(booking._id, createdBy, excludedPaymentId);
  if (paymentType === 'Refund' && amount > financials.totalPaid) {
    return 'Refund cannot exceed the amount already paid';
  }
  if (paymentType !== 'Refund' && amount > Math.max(0, booking.totalAmount - financials.totalPaid)) {
    return 'Payment exceeds the remaining booking balance';
  }
  return null;
};

const populatePayment = (query) => query
  .populate('booking', 'bookingNumber totalAmount status')
  .populate('trip', 'destination travelDate status')
  .populate('customer', 'name phone email');

const getPayments = async (req, res) => {
  try {
    const { booking, trip, paymentMethod, paymentType, search } = req.query;
    const filter = { createdBy: req.user._id };
    if (booking && booking !== 'All') filter.booking = booking;
    if (trip && trip !== 'All') filter.trip = trip;
    if (paymentMethod && paymentMethod !== 'All') filter.paymentMethod = paymentMethod;
    if (paymentType && paymentType !== 'All') filter.paymentType = paymentType;
    if (search) {
      const keyword = search.trim();
      filter.$or = [
        { paymentNumber: new RegExp(keyword, 'i') },
        { referenceNumber: new RegExp(keyword, 'i') },
      ];
    }

    const payments = await populatePayment(Payment.find(filter).sort({ paymentDate: -1, createdAt: -1 }));
    return successResponse(res, 200, 'Payments fetched successfully', payments);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch payments');
  }
};

const createPayment = async (req, res) => {
  try {
    const validationError = validatePaymentFields(req.body);
    if (validationError) return errorResponse(res, 400, validationError);

    const relations = await resolveRelations(req, req.body);
    if (relations.error) return errorResponse(res, relations.status || 400, relations.error);

    const amount = parseAmount(req.body.amount);
    const limitError = await validatePaymentLimit(relations.booking, req.user._id, amount, req.body.paymentType);
    if (limitError) return errorResponse(res, 400, limitError);

    const payment = await Payment.create({
      paymentNumber: await generatePaymentNumber(),
      booking: relations.booking._id,
      trip: req.body.trip || null,
      customer: relations.customer._id,
      amount,
      paymentDate: validatePaymentDate(req.body.paymentDate),
      paymentMethod: req.body.paymentMethod,
      paymentType: req.body.paymentType,
      referenceNumber: req.body.referenceNumber || '',
      notes: req.body.notes || '',
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Payment created successfully', await populatePayment(Payment.findById(payment._id)));
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create payment');
  }
};

const getPaymentById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Payment ID is invalid');
    const payment = await populatePayment(Payment.findOne({ _id: req.params.id, createdBy: req.user._id }));
    if (!payment) return errorResponse(res, 404, 'Payment not found');
    return successResponse(res, 200, 'Payment fetched successfully', payment);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch payment');
  }
};

const updatePayment = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Payment ID is invalid');
    const payment = await Payment.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!payment) return errorResponse(res, 404, 'Payment not found');

    const body = { ...payment.toObject(), ...req.body, booking: req.body.booking || payment.booking };
    const validationError = validatePaymentFields(body);
    if (validationError) return errorResponse(res, 400, validationError);

    const relations = await resolveRelations(req, body);
    if (relations.error) return errorResponse(res, relations.status || 400, relations.error);

    const amount = parseAmount(body.amount);
    const limitError = await validatePaymentLimit(relations.booking, req.user._id, amount, body.paymentType, payment._id);
    if (limitError) return errorResponse(res, 400, limitError);

    payment.booking = relations.booking._id;
    payment.trip = body.trip || null;
    payment.customer = relations.customer._id;
    payment.amount = amount;
    payment.paymentDate = validatePaymentDate(body.paymentDate);
    payment.paymentMethod = body.paymentMethod;
    payment.paymentType = body.paymentType;
    payment.referenceNumber = body.referenceNumber || '';
    payment.notes = body.notes || '';
    await payment.save();

    return successResponse(res, 200, 'Payment updated successfully', await populatePayment(Payment.findById(payment._id)));
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update payment');
  }
};

const deletePayment = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Payment ID is invalid');
    const payment = await Payment.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!payment) return errorResponse(res, 404, 'Payment not found');
    await payment.deleteOne();
    return successResponse(res, 200, 'Payment deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete payment');
  }
};

module.exports = { getPayments, createPayment, getPaymentById, updatePayment, deletePayment };

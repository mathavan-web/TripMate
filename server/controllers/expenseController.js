const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const expenseCategories = ['Fuel', 'Toll', 'Parking', 'Food', 'Driver Allowance', 'Accommodation', 'Maintenance', 'Permit', 'Other'];
const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];

const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);
const parseAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};
const parseDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date : null;
};

const generateExpenseNumber = async () => {
  const count = await Expense.countDocuments();
  return `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

const resolveRelations = async (req, body) => {
  if (!body.trip || !isValidId(body.trip)) return { error: 'A valid trip is required' };
  const trip = await Trip.findOne({ _id: body.trip, createdBy: req.user._id });
  if (!trip) return { error: 'Trip not found', status: 404 };

  const bookingId = body.booking || trip.booking;
  if (!isValidId(bookingId) || String(bookingId) !== String(trip.booking)) {
    return { error: 'Expense booking must match the trip booking' };
  }

  const booking = await Booking.findOne({ _id: bookingId, createdBy: req.user._id });
  if (!booking) return { error: 'Booking not found', status: 404 };
  return { trip, booking };
};

const validateFields = (body) => {
  const amount = parseAmount(body.amount);
  if (amount === null || amount <= 0) return 'Expense amount must be greater than zero';
  if (!expenseCategories.includes(body.category)) return 'Expense category is invalid';
  if (!paymentMethods.includes(body.paymentMethod)) return 'Payment method is invalid';
  if (!parseDate(body.expenseDate)) return 'Expense date is invalid';
  return null;
};

const populateExpense = (query) => query
  .populate('trip', 'destination travelDate status')
  .populate('booking', 'bookingNumber totalAmount status');

const getExpenses = async (req, res) => {
  try {
    const { trip, booking, category, expenseDate, search } = req.query;
    const filter = { createdBy: req.user._id };
    if (trip && trip !== 'All') filter.trip = trip;
    if (booking && booking !== 'All') filter.booking = booking;
    if (category && category !== 'All') filter.category = category;
    if (expenseDate) {
      const date = parseDate(expenseDate);
      if (!date) return errorResponse(res, 400, 'Expense date is invalid');
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      filter.expenseDate = { $gte: start, $lte: end };
    }
    if (search) {
      const keyword = search.trim();
      filter.$or = [
        { expenseNumber: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') },
        { referenceNumber: new RegExp(keyword, 'i') },
      ];
    }

    const expenses = await populateExpense(Expense.find(filter).sort({ expenseDate: -1, createdAt: -1 }));
    return successResponse(res, 200, 'Expenses fetched successfully', expenses);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch expenses');
  }
};

const createExpense = async (req, res) => {
  try {
    const validationError = validateFields(req.body);
    if (validationError) return errorResponse(res, 400, validationError);
    const relations = await resolveRelations(req, req.body);
    if (relations.error) return errorResponse(res, relations.status || 400, relations.error);

    const expense = await Expense.create({
      expenseNumber: await generateExpenseNumber(),
      trip: relations.trip._id,
      booking: relations.booking._id,
      category: req.body.category,
      description: req.body.description || '',
      amount: parseAmount(req.body.amount),
      expenseDate: parseDate(req.body.expenseDate),
      paymentMethod: req.body.paymentMethod,
      referenceNumber: req.body.referenceNumber || '',
      notes: req.body.notes || '',
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Expense created successfully', await populateExpense(Expense.findById(expense._id)));
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create expense');
  }
};

const getExpenseById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Expense ID is invalid');
    const expense = await populateExpense(Expense.findOne({ _id: req.params.id, createdBy: req.user._id }));
    if (!expense) return errorResponse(res, 404, 'Expense not found');
    return successResponse(res, 200, 'Expense fetched successfully', expense);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch expense');
  }
};

const updateExpense = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Expense ID is invalid');
    const expense = await Expense.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!expense) return errorResponse(res, 404, 'Expense not found');

    const body = { ...expense.toObject(), ...req.body, trip: req.body.trip || expense.trip, booking: req.body.booking || expense.booking };
    const validationError = validateFields(body);
    if (validationError) return errorResponse(res, 400, validationError);
    const relations = await resolveRelations(req, body);
    if (relations.error) return errorResponse(res, relations.status || 400, relations.error);

    expense.trip = relations.trip._id;
    expense.booking = relations.booking._id;
    expense.category = body.category;
    expense.description = body.description || '';
    expense.amount = parseAmount(body.amount);
    expense.expenseDate = parseDate(body.expenseDate);
    expense.paymentMethod = body.paymentMethod;
    expense.referenceNumber = body.referenceNumber || '';
    expense.notes = body.notes || '';
    await expense.save();

    return successResponse(res, 200, 'Expense updated successfully', await populateExpense(Expense.findById(expense._id)));
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update expense');
  }
};

const deleteExpense = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return errorResponse(res, 400, 'Expense ID is invalid');
    const expense = await Expense.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!expense) return errorResponse(res, 404, 'Expense not found');
    await expense.deleteOne();
    return successResponse(res, 200, 'Expense deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete expense');
  }
};

module.exports = { getExpenses, createExpense, getExpenseById, updateExpense, deleteExpense };

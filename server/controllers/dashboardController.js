const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { sumPayments } = require('../utils/financials');

const getDashboardMetrics = async (req, res) => {
  try {
    const [bookings, payments, expenses] = await Promise.all([
      Booking.find({ createdBy: req.user._id }).select('totalAmount'),
      Payment.find({ createdBy: req.user._id }).select('booking amount paymentType'),
      Expense.find({ createdBy: req.user._id }).select('amount'),
    ]);

    const paymentsByBooking = new Map();
    payments.forEach((payment) => {
      const bookingId = String(payment.booking);
      const current = paymentsByBooking.get(bookingId) || [];
      current.push(payment);
      paymentsByBooking.set(bookingId, current);
    });

    const totalRevenue = bookings.reduce((total, booking) => total + Number(booking.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
    const pendingPayments = bookings.reduce((total, booking) => {
      const paid = sumPayments(paymentsByBooking.get(String(booking._id)) || []);
      return total + Math.max(0, Number(booking.totalAmount || 0) - paid);
    }, 0);

    return successResponse(res, 200, 'Dashboard financial metrics fetched successfully', {
      totalRevenue,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
      pendingPayments,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch dashboard financial metrics');
  }
};

module.exports = { getDashboardMetrics };

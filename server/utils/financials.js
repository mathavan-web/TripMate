const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

const getPaymentValue = (payment) => (payment.paymentType === 'Refund' ? -payment.amount : payment.amount);

const sumPayments = (payments) => payments.reduce((total, payment) => total + getPaymentValue(payment), 0);

const getBookingFinancials = async (bookingId, createdBy, excludedPaymentId = null) => {
  const paymentFilter = { booking: bookingId, createdBy };
  if (excludedPaymentId) paymentFilter._id = { $ne: excludedPaymentId };

  const [payments, expenses] = await Promise.all([
    Payment.find(paymentFilter).select('amount paymentType'),
    Expense.find({ booking: bookingId, createdBy }).select('amount'),
  ]);

  return {
    payments,
    totalPaid: sumPayments(payments),
    totalExpenses: expenses.reduce((total, expense) => total + expense.amount, 0),
  };
};

const getTripFinancials = async (trip, createdBy) => {
  const bookingId = trip.booking?._id || trip.booking;
  const [paymentData, expenses] = await Promise.all([
    getBookingFinancials(bookingId, createdBy),
    Expense.find({ trip: trip._id, createdBy }).select('amount'),
  ]);

  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
  const revenue = Number(trip.booking?.totalAmount || 0);

  return {
    revenue,
    totalPaid: paymentData.totalPaid,
    balance: Math.max(0, revenue - paymentData.totalPaid),
    totalExpenses,
    profit: revenue - totalExpenses,
  };
};

module.exports = { getBookingFinancials, getTripFinancials, getPaymentValue, sumPayments };

const crypto = require('node:crypto');
const Invoice = require('../models/Invoice');
const InvoiceSequence = require('../models/InvoiceSequence');
const BusinessProfile = require('../models/BusinessProfile');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Trip = require('../models/Trip');
const { getBookingFinancials } = require('./financials');

class InvoicePrerequisiteError extends Error {}

const getPaymentStatus = (totalAmount, amountPaid) => {
  if (amountPaid >= totalAmount) return 'PAID';
  return amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
};

const getInvoicePaymentValues = (totalAmount, netPayments) => {
  const amountPaid = Math.max(0, Number(netPayments) || 0);
  const balanceDue = Math.max(0, Number(totalAmount) - amountPaid);
  return { amountPaid, balanceDue, paymentStatus: getPaymentStatus(totalAmount, amountPaid) };
};

const nextInvoiceNumber = async (year = new Date().getFullYear()) => {
  let sequence;
  try {
    sequence = await InvoiceSequence.findOneAndUpdate(
      { year },
      { $inc: { sequence: 1 }, $setOnInsert: { year } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    sequence = await InvoiceSequence.findOneAndUpdate(
      { year },
      { $inc: { sequence: 1 } },
      { new: true }
    );
  }
  return `INV-${year}-${String(sequence.sequence).padStart(4, '0')}`;
};

const createPublicInvoiceToken = () => crypto.randomBytes(32).toString('hex');

const ensureInvoiceAccessToken = async (invoice) => {
  const token = createPublicInvoiceToken();
  invoice.publicAccessTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  invoice.publicAccessTokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await invoice.save();
  return token;
};

const createInvoiceForCompletedTrip = async (tripId, createdBy) => {
  const existingInvoice = await Invoice.findOne({ trip: tripId, createdBy });
  if (existingInvoice) {
    await ensureInvoiceAccessToken(existingInvoice);
    return { invoice: existingInvoice, created: false };
  }

  const trip = await Trip.findOne({ _id: tripId, createdBy });
  if (!trip || trip.status !== 'Completed') throw new InvoicePrerequisiteError('A completed trip is required to create an invoice');

  const [booking, customer, business] = await Promise.all([
    Booking.findOne({ _id: trip.booking, createdBy }).populate('package', 'name'),
    Customer.findOne({ _id: trip.customer, createdBy }),
    BusinessProfile.findOne({ user: createdBy }),
  ]);

  if (!booking) throw new InvoicePrerequisiteError('A valid booking is required to create an invoice');
  if (!customer || String(booking.customer) !== String(customer._id)) {
    throw new InvoicePrerequisiteError('The trip customer must match the booking customer');
  }
  if (!business || !business.businessName || !(business.phone || business.email)) {
    throw new InvoicePrerequisiteError('Complete the business name and at least one contact method before completing this trip');
  }
  if (!customer.name || !customer.phone) throw new InvoicePrerequisiteError('Customer name and phone are required to create an invoice');
  const totalAmount = Number(booking.totalAmount);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new InvoicePrerequisiteError('A positive booking amount is required to create an invoice');
  }

  const financials = await getBookingFinancials(booking._id, createdBy);
  const paymentValues = getInvoicePaymentValues(totalAmount, financials.totalPaid);
  const year = new Date().getFullYear();
  const packageName = booking.package?.name || '';
  const description = packageName || trip.destination || 'Travel service';

  const invoiceData = {
    invoiceNumber: await nextInvoiceNumber(year),
    invoiceDate: new Date(),
    business: business._id,
    customer: customer._id,
    booking: booking._id,
    trip: trip._id,
    createdBy,
    businessSnapshot: {
      businessName: business.businessName || '', ownerName: business.ownerName || '',
      phone: business.phone || '', whatsapp: business.whatsapp || '', email: business.email || '',
      address: business.address || '', city: business.city || '', state: business.state || '',
      pinCode: business.pinCode || '', logo: business.logo || '', upiId: business.upiId || '',
      paymentInformation: business.paymentInformation || '', termsAndConditions: business.termsAndConditions || '',
    },
    customerSnapshot: {
      name: customer.name, phone: customer.phone, whatsapp: customer.whatsapp || '',
      whatsappOptIn: customer.whatsappOptIn === true,
      email: customer.email || '', address: customer.address || '', city: customer.city || '',
      state: customer.state || '', pinCode: customer.pinCode || '',
    },
    tripSnapshot: {
      bookingNumber: booking.bookingNumber, packageName, destination: trip.destination || booking.destination || '',
      pickupLocation: trip.pickupLocation || booking.pickupLocation || '',
      dropLocation: trip.dropLocation || booking.dropLocation || '',
      travelDate: trip.travelDate || booking.travelDate || null, returnDate: trip.returnDate || booking.returnDate || null,
      vehicleType: trip.vehicleType || booking.vehicleType || '', vehicleModel: trip.vehicleModel || '',
      vehicleNumber: trip.vehicleNumber || '',
    },
    items: [{ description, quantity: 1, unitPrice: totalAmount, total: totalAmount }],
    subtotal: totalAmount,
    totalAmount,
    ...paymentValues,
  };

  try {
    const invoice = await Invoice.create(invoiceData);
    await ensureInvoiceAccessToken(invoice);
    return { invoice, created: true };
  } catch (error) {
    if (error.code !== 11000) throw error;
    const duplicate = await Invoice.findOne({ trip: trip._id, createdBy });
    if (duplicate) return { invoice: duplicate, created: false };
    throw error;
  }
};

const refreshInvoicePayments = async (bookingId, createdBy) => {
  const invoice = await Invoice.findOne({ booking: bookingId, createdBy });
  if (!invoice) return null;
  const financials = await getBookingFinancials(bookingId, createdBy);
  Object.assign(invoice, getInvoicePaymentValues(invoice.totalAmount, financials.totalPaid));
  await invoice.save();
  return invoice;
};

const createReviewToken = () => crypto.randomBytes(32).toString('hex');

module.exports = {
  createInvoiceForCompletedTrip,
  createPublicInvoiceToken,
  createReviewToken,
  ensureInvoiceAccessToken,
  InvoicePrerequisiteError,
  getInvoicePaymentValues,
  getPaymentStatus,
  nextInvoiceNumber,
  refreshInvoicePayments,
};
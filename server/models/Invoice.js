const mongoose = require('mongoose');

const businessSnapshotSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pinCode: { type: String, default: '' },
    logo: { type: String, default: '' },
    upiId: { type: String, default: '' },
    paymentInformation: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
  },
  { _id: false }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, default: '' },
    whatsappOptIn: { type: Boolean, default: false },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pinCode: { type: String, default: '' },
  },
  { _id: false }
);

const tripSnapshotSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true },
    packageName: { type: String, default: '' },
    destination: { type: String, default: '' },
    pickupLocation: { type: String, default: '' },
    dropLocation: { type: String, default: '' },
    travelDate: { type: Date, default: null },
    returnDate: { type: Date, default: null },
    vehicleType: { type: String, default: '' },
    vehicleModel: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
  },
  { _id: false }
);

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessSnapshot: { type: businessSnapshotSchema, required: true },
    customerSnapshot: { type: customerSnapshotSchema, required: true },
    tripSnapshot: { type: tripSnapshotSchema, required: true },
    items: { type: [invoiceItemSchema], required: true, validate: (items) => items.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0.01 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    balanceDue: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['PAID', 'PARTIALLY_PAID', 'UNPAID'], required: true },
    pdfStatus: { type: String, enum: ['PENDING', 'GENERATED', 'FAILED'], default: 'PENDING' },
    pdfFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    pdfError: { type: String, default: '' },
    whatsappStatus: { type: String, enum: ['NOT_SENT', 'SENT', 'DELIVERED', 'FAILED'], default: 'NOT_SENT' },
    whatsappMessageId: { type: String, default: '' },
    whatsappSentAt: { type: Date, default: null },
    whatsappDeliveredAt: { type: Date, default: null },
    whatsappError: { type: String, default: '' },
    publicAccessTokenHash: { type: String, default: '', select: false },
    publicAccessTokenExpiresAt: { type: Date, default: null, select: false },
    reviewTokenHash: { type: String, default: '', select: false },
    reviewTokenExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

invoiceSchema.index({ createdBy: 1, trip: 1 }, { unique: true });
invoiceSchema.index({ createdBy: 1, invoiceDate: -1 });
invoiceSchema.index({ createdBy: 1, paymentStatus: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
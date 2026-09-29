const mongoose = require('mongoose');

const invoiceSequenceSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    sequence: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

invoiceSequenceSchema.index({ year: 1 }, { unique: true });

module.exports = mongoose.model('InvoiceSequence', invoiceSequenceSchema);
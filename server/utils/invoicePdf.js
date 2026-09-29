const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

const money = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const storeInvoicePdf = (invoice) => new Promise((resolve, reject) => {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'invoicePdfs' });
  const upload = bucket.openUploadStream(`${invoice.invoiceNumber}.pdf`, {
    contentType: 'application/pdf',
    metadata: { invoiceId: invoice._id, createdBy: invoice.createdBy },
  });
  const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Invoice ${invoice.invoiceNumber}` } });
  const oldFileId = invoice.pdfFileId;
  let settled = false;

  upload.on('error', (error) => {
    if (settled) return;
    settled = true;
    reject(error);
  });
  upload.on('finish', async () => {
    if (settled) return;
    settled = true;
    try {
      if (oldFileId) await bucket.delete(oldFileId).catch(() => {});
      resolve(upload.id);
    } catch (error) {
      reject(error);
    }
  });

  doc.pipe(upload);
  const business = invoice.businessSnapshot;
  const customer = invoice.customerSnapshot;
  const trip = invoice.tripSnapshot;

  doc.fillColor('#1565C0').fontSize(22).font('Helvetica-Bold').text(business.businessName, { continued: true });
  doc.fillColor('#172B4D').fontSize(10).font('Helvetica').text(`\nINVOICE ${invoice.invoiceNumber}`, { align: 'right' });
  doc.moveDown(0.5).fillColor('#5a6979').fontSize(9);
  doc.text([business.ownerName, business.phone, business.email, [business.address, business.city, business.state, business.pinCode].filter(Boolean).join(', ')].filter(Boolean).join(' | '));
  doc.moveDown(1.5).fillColor('#172B4D').fontSize(11).font('Helvetica-Bold').text('Bill To');
  doc.font('Helvetica').fontSize(10).text(customer.name);
  doc.text([customer.phone, customer.email, [customer.address, customer.city, customer.state, customer.pinCode].filter(Boolean).join(', ')].filter(Boolean).join('\n'));
  doc.moveDown().font('Helvetica-Bold').text('Trip Details');
  doc.font('Helvetica').text(`Booking: ${trip.bookingNumber}`);
  doc.text(`Service: ${trip.packageName || trip.destination || 'Travel service'}`);
  doc.text(`Route: ${[trip.pickupLocation, trip.destination, trip.dropLocation].filter(Boolean).join(' to ') || 'Not specified'}`);
  doc.text(`Travel dates: ${trip.travelDate ? new Date(trip.travelDate).toLocaleDateString('en-IN') : '-'}${trip.returnDate ? ` - ${new Date(trip.returnDate).toLocaleDateString('en-IN')}` : ''}`);
  doc.text(`Vehicle: ${[trip.vehicleType, trip.vehicleModel, trip.vehicleNumber].filter(Boolean).join(' / ') || '-'}`);
  doc.moveDown(1.5);

  const tableTop = doc.y;
  doc.rect(48, tableTop, 499, 26).fill('#F5F7FA');
  doc.fillColor('#172B4D').font('Helvetica-Bold').fontSize(9);
  doc.text('DESCRIPTION', 58, tableTop + 8);
  doc.text('QTY', 360, tableTop + 8, { width: 45, align: 'right' });
  doc.text('AMOUNT', 420, tableTop + 8, { width: 117, align: 'right' });
  doc.font('Helvetica').fontSize(10).fillColor('#172B4D');
  let rowY = tableTop + 36;
  for (const item of invoice.items) {
    doc.text(item.description, 58, rowY, { width: 285 });
    doc.text(String(item.quantity), 360, rowY, { width: 45, align: 'right' });
    doc.text(money(item.total), 420, rowY, { width: 117, align: 'right' });
    rowY += 26;
  }

  rowY += 10;
  doc.moveTo(330, rowY).lineTo(547, rowY).strokeColor('#dfe7f1').stroke();
  rowY += 12;
  doc.font('Helvetica-Bold').text(`Total: ${money(invoice.totalAmount)}`, 330, rowY, { width: 217, align: 'right' });
  rowY += 20;
  doc.font('Helvetica').text(`Amount paid: ${money(invoice.amountPaid)}`, 330, rowY, { width: 217, align: 'right' });
  rowY += 20;
  doc.font('Helvetica-Bold').text(`Balance due: ${money(invoice.balanceDue)}`, 330, rowY, { width: 217, align: 'right' });
  rowY += 20;
  doc.font('Helvetica').text(`Payment status: ${invoice.paymentStatus.replaceAll('_', ' ')}`, 330, rowY, { width: 217, align: 'right' });
  if (business.upiId || business.paymentInformation) {
    doc.moveDown(2).fillColor('#5a6979').fontSize(9).text([business.upiId && `UPI: ${business.upiId}`, business.paymentInformation].filter(Boolean).join('\n'));
  }
  if (business.termsAndConditions) doc.moveDown().text(business.termsAndConditions);
  doc.end();
});

const openInvoicePdf = (fileId, res) => {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'invoicePdfs' });
  return bucket.openDownloadStream(fileId).on('error', () => {
    if (!res.headersSent) res.status(404).end();
  }).pipe(res);
};

module.exports = { openInvoicePdf, storeInvoicePdf };
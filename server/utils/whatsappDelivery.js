const mongoose = require('mongoose');

const normalizeWhatsAppNumber = (value = '') => {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.startsWith('0') && digits.length > 10) return `91${digits.replace(/^0+/, '')}`;
  return digits;
};

const buildWhatsAppShareUrl = (invoice, invoiceUrl) => {
  const customer = invoice?.customerSnapshot || {};
  const business = invoice?.businessSnapshot || {};
  const number = normalizeWhatsAppNumber(customer.whatsapp || customer.phone || '');
  if (!number || !invoiceUrl) return '';

  const message = [
    `Hello ${customer.name || 'Customer'},`,
    '',
    `Thank you for choosing ${business.businessName || 'TripMate'}.`,
    '',
    'Your trip invoice is ready.',
    '',
    `Invoice No: ${invoice.invoiceNumber || 'N/A'}`,
    `Total Amount: ₹${Number(invoice.totalAmount || 0).toLocaleString('en-IN')}`,
    `Paid Amount: ₹${Number(invoice.amountPaid || 0).toLocaleString('en-IN')}`,
    `Balance: ₹${Number(invoice.balanceDue || 0).toLocaleString('en-IN')}`,
    '',
    'View your invoice:',
    invoiceUrl,
    '',
    'Thank you for choosing us!',
  ].join('\n');

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

const isWhatsAppConfigured = () => Boolean(
  process.env.WHATSAPP_ACCESS_TOKEN
  && process.env.WHATSAPP_PHONE_NUMBER_ID
  && process.env.WHATSAPP_GRAPH_API_VERSION
);

const getPdfBuffer = (fileId) => new Promise((resolve, reject) => {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'invoicePdfs' });
  const chunks = [];
  const stream = bucket.openDownloadStream(fileId);
  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('error', reject);
  stream.on('end', () => resolve(Buffer.concat(chunks)));
});

const sendInvoiceDocument = async (invoice, customer) => {
  if (!isWhatsAppConfigured()) throw new Error('WhatsApp Cloud API is not configured');
  if (!invoice.pdfFileId) throw new Error('Generate the invoice PDF before sending it');
  if (invoice.customerSnapshot.whatsappOptIn !== true || customer?.whatsappOptIn !== true) {
    throw new Error('Customer WhatsApp consent is required before sending an invoice');
  }

  const recipient = String(customer.whatsapp || customer.phone || '').replace(/\D/g, '');
  if (recipient.length < 8) throw new Error('A valid customer WhatsApp number is required');

  const baseUrl = `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
  const headers = { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` };
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', 'application/pdf');
  formData.append('file', new Blob([await getPdfBuffer(invoice.pdfFileId)], { type: 'application/pdf' }), `${invoice.invoiceNumber}.pdf`);

  const uploadResponse = await fetch(`${baseUrl}/media`, { method: 'POST', headers, body: formData });
  if (!uploadResponse.ok) throw new Error(`WhatsApp media upload failed (HTTP ${uploadResponse.status})`);
  const media = await uploadResponse.json();

  const messageResponse = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'document',
      document: { id: media.id, filename: `${invoice.invoiceNumber}.pdf`, caption: `Invoice ${invoice.invoiceNumber}` },
    }),
  });
  if (!messageResponse.ok) throw new Error(`WhatsApp message send failed (HTTP ${messageResponse.status})`);
  const result = await messageResponse.json();
  const messageId = result.messages?.[0]?.id;
  if (!messageId) throw new Error('WhatsApp did not confirm message acceptance');
  return messageId;
};

module.exports = {
  buildWhatsAppShareUrl,
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  sendInvoiceDocument,
};
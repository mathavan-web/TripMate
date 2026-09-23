const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorResponse } = require('./utils/apiResponse');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'TripMate API is running',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/business', require('./routes/businessRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use((req, res) => {
  return errorResponse(res, 404, 'Route not found');
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  return errorResponse(res, 500, 'Something went wrong');
});

module.exports = app;

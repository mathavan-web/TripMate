const Quotation = require('../models/Quotation');
const Enquiry = require('../models/Enquiry');
const Customer = require('../models/Customer');
const Package = require('../models/Package');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateQuotationNumber = async (createdBy) => {
  const count = await Quotation.countDocuments({ createdBy });
  const year = new Date().getFullYear();
  return `QT-${year}-${String(count + 1).padStart(4, '0')}`;
};

const calculateQuotationValues = (items = [], discount = 0, tax = 0, advanceAmount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const safeDiscount = Number(discount || 0);
  const safeTax = Number(tax || 0);
  const totalAmount = Math.max(0, subtotal - safeDiscount + safeTax);
  const balanceAmount = Math.max(0, totalAmount - Number(advanceAmount || 0));

  return { subtotal, totalAmount, balanceAmount };
};

const getQuotations = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = { createdBy: req.user._id };

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      const customerMatches = await Customer.find({ createdBy: req.user._id, $or: [{ name: new RegExp(search.trim(), 'i') }, { phone: new RegExp(search.trim(), 'i') }] }).select('_id');
      const packageMatches = await Package.find({ createdBy: req.user._id, name: new RegExp(search.trim(), 'i') }).select('_id');

      filter.$or = [
        { quotationNumber: new RegExp(search.trim(), 'i') },
        { customer: { $in: customerMatches.map((customer) => customer._id) } },
        { package: { $in: packageMatches.map((pkg) => pkg._id) } },
      ];
    }

    const quotations = await Quotation.find(filter)
      .populate('customer', 'name phone email')
      .populate('package', 'name packageType basePrice')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Quotations fetched successfully', quotations);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch quotations');
  }
};

const createQuotation = async (req, res) => {
  try {
    const { customer, enquiry, package: packageId, travelDate, returnDate, pickupLocation, dropLocation, destination, passengers, vehicleType, items, discount, tax, advanceAmount, validUntil, termsAndConditions, notes, status } = req.body;

    if (!customer) {
      return errorResponse(res, 400, 'Please select a customer');
    }

    const customerExists = await Customer.findOne({ _id: customer, createdBy: req.user._id, isArchived: false });
    if (!customerExists) {
      return errorResponse(res, 404, 'Customer not found');
    }

    if (enquiry) {
      const enquiryExists = await Enquiry.findOne({ _id: enquiry, createdBy: req.user._id, isArchived: false });
      if (!enquiryExists) {
        return errorResponse(res, 404, 'Enquiry not found');
      }
    }

    if (packageId) {
      const packageExists = await Package.findOne({ _id: packageId, createdBy: req.user._id, isActive: true });
      if (!packageExists) {
        return errorResponse(res, 404, 'Selected package is not available');
      }
    }

    const normalizedItems = (items || []).map((item) => {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice || 0);
      const total = quantity * unitPrice;
      return {
        description: item.description || 'Item',
        quantity,
        unitPrice,
        total,
      };
    });

    const { subtotal, totalAmount, balanceAmount } = calculateQuotationValues(normalizedItems, discount, tax, advanceAmount);

    const quotationNumber = await generateQuotationNumber(req.user._id);

    const quotation = await Quotation.create({
      quotationNumber,
      customer,
      enquiry: enquiry || null,
      package: packageId || null,
      travelDate: travelDate || null,
      returnDate: returnDate || null,
      pickupLocation: pickupLocation || '',
      dropLocation: dropLocation || '',
      destination: destination || '',
      passengers: Number(passengers || 1),
      vehicleType: vehicleType || '',
      items: normalizedItems,
      subtotal,
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      totalAmount,
      advanceAmount: Number(advanceAmount || 0),
      balanceAmount,
      validUntil: validUntil || null,
      termsAndConditions: termsAndConditions || '',
      notes: notes || '',
      status: status || 'Draft',
      createdBy: req.user._id,
    });

    const populated = await Quotation.findById(quotation._id)
      .populate('customer', 'name phone email address city state')
      .populate('package', 'name packageType basePrice duration destinations');

    return successResponse(res, 201, 'Quotation created successfully', populated);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create quotation');
  }
};

const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('customer', 'name phone whatsapp email address city state pinCode')
      .populate('enquiry', 'travelDate destination pickupLocation dropLocation status')
      .populate('package', 'name packageType description duration destinations priceType basePrice inclusions exclusions termsAndConditions');

    if (!quotation) {
      return errorResponse(res, 404, 'Quotation not found');
    }

    return successResponse(res, 200, 'Quotation fetched successfully', quotation);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch quotation');
  }
};

const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quotation) {
      return errorResponse(res, 404, 'Quotation not found');
    }

    const allowedFields = ['customer', 'enquiry', 'package', 'travelDate', 'returnDate', 'pickupLocation', 'dropLocation', 'destination', 'passengers', 'vehicleType', 'discount', 'tax', 'advanceAmount', 'validUntil', 'termsAndConditions', 'notes', 'status'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) quotation[field] = req.body[field];
    });

    if (req.body.items) {
      quotation.items = (req.body.items || []).map((item) => ({
        description: item.description || 'Item',
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        total: Number(item.quantity || 1) * Number(item.unitPrice || 0),
      }));
    }

    const { subtotal, totalAmount, balanceAmount } = calculateQuotationValues(quotation.items, quotation.discount, quotation.tax, quotation.advanceAmount);
    quotation.subtotal = subtotal;
    quotation.totalAmount = totalAmount;
    quotation.balanceAmount = balanceAmount;

    await quotation.save();

    const populated = await Quotation.findById(quotation._id)
      .populate('customer', 'name phone email address city state')
      .populate('package', 'name packageType basePrice');

    return successResponse(res, 200, 'Quotation updated successfully', populated);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update quotation');
  }
};

const updateQuotationStatus = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quotation) {
      return errorResponse(res, 404, 'Quotation not found');
    }

    quotation.status = req.body.status || quotation.status;
    await quotation.save();
    return successResponse(res, 200, 'Quotation status updated successfully', quotation);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update quotation status');
  }
};

module.exports = {
  getQuotations,
  createQuotation,
  getQuotationById,
  updateQuotation,
  updateQuotationStatus,
};

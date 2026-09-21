const Customer = require('../models/Customer');
const Enquiry = require('../models/Enquiry');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const sanitizeCustomerQuery = (value) => (typeof value === 'string' ? value.trim() : '');

const getCustomers = async (req, res) => {
  try {
    const { search, city, state, archived } = req.query;
    const query = {
      createdBy: req.user._id,
      ...(archived === 'true' ? { isArchived: true } : { isArchived: false }),
    };

    if (city) query.city = new RegExp(sanitizeCustomerQuery(city), 'i');
    if (state) query.state = new RegExp(sanitizeCustomerQuery(state), 'i');

    if (search) {
      query.$or = [
        { name: new RegExp(sanitizeCustomerQuery(search), 'i') },
        { phone: new RegExp(sanitizeCustomerQuery(search), 'i') },
        { whatsapp: new RegExp(sanitizeCustomerQuery(search), 'i') },
        { email: new RegExp(sanitizeCustomerQuery(search), 'i') },
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    const customersWithEnquiryCount = await Promise.all(
      customers.map(async (customer) => {
        const enquiryCount = await Enquiry.countDocuments({ customer: customer._id, createdBy: req.user._id, isArchived: false });
        return {
          ...customer.toObject(),
          enquiryCount,
        };
      })
    );

    return successResponse(res, 200, 'Customers fetched successfully', customersWithEnquiryCount);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch customers');
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, phone, whatsapp, email, address, city, state, pinCode, notes } = req.body;

    if (!name || !phone) {
      return errorResponse(res, 400, 'Customer name and phone number are required');
    }

    const existingCustomer = await Customer.findOne({
      createdBy: req.user._id,
      $or: [
        { phone: phone.trim() },
        { email: email ? email.trim().toLowerCase() : '' },
      ],
    });

    if (existingCustomer) {
      return errorResponse(res, 409, 'A customer with this phone or email already exists');
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp ? whatsapp.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      pinCode: pinCode ? pinCode.trim() : '',
      notes: notes ? notes.trim() : '',
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Customer created successfully', customer);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create customer');
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user._id, isArchived: false });

    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    const enquiries = await Enquiry.find({ customer: customer._id, createdBy: req.user._id, isArchived: false }).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Customer fetched successfully', { ...customer.toObject(), enquiries });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch customer');
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { name, phone, whatsapp, email, address, city, state, pinCode, notes } = req.body;

    if (!name || !phone) {
      return errorResponse(res, 400, 'Customer name and phone number are required');
    }

    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user._id, isArchived: false });
    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    const duplicateCheck = await Customer.findOne({
      createdBy: req.user._id,
      _id: { $ne: customer._id },
      $or: [
        { phone: phone.trim() },
        { email: email ? email.trim().toLowerCase() : '' },
      ],
    });

    if (duplicateCheck) {
      return errorResponse(res, 409, 'Another customer already uses this phone or email');
    }

    customer.name = name.trim();
    customer.phone = phone.trim();
    customer.whatsapp = whatsapp ? whatsapp.trim() : '';
    customer.email = email ? email.trim().toLowerCase() : '';
    customer.address = address ? address.trim() : '';
    customer.city = city ? city.trim() : '';
    customer.state = state ? state.trim() : '';
    customer.pinCode = pinCode ? pinCode.trim() : '';
    customer.notes = notes ? notes.trim() : '';

    await customer.save();

    return successResponse(res, 200, 'Customer updated successfully', customer);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update customer');
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!customer) {
      return errorResponse(res, 404, 'Customer not found');
    }

    const enquiries = await Enquiry.countDocuments({ customer: customer._id, createdBy: req.user._id, isArchived: false });

    if (enquiries > 0) {
      customer.isArchived = true;
      await customer.save();
      return successResponse(res, 200, 'Customer archived successfully', customer);
    }

    await customer.deleteOne();
    return successResponse(res, 200, 'Customer deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete customer');
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};

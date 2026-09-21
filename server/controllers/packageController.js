const Package = require('../models/Package');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getPackages = async (req, res) => {
  try {
    const { search, status, packageType } = req.query;
    const filter = { createdBy: req.user._id };

    if (status && status !== 'All') {
      filter.isActive = status === 'Active';
    }

    if (packageType && packageType !== 'All') {
      filter.packageType = packageType;
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
        { destinations: { $in: [new RegExp(search.trim(), 'i')] } },
        { vehicleType: new RegExp(search.trim(), 'i') },
      ];
    }

    const packages = await Package.find(filter).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Packages fetched successfully', packages);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch packages');
  }
};

const createPackage = async (req, res) => {
  try {
    const { name, description, packageType, duration, numberOfDays, numberOfNights, destinations, pickupLocation, dropLocation, vehicleType, maxPassengers, basePrice, priceType, inclusions, exclusions, termsAndConditions, isActive } = req.body;

    if (!name || !packageType) {
      return errorResponse(res, 400, 'Package name and type are required');
    }

    const pkg = await Package.create({
      name: name.trim(),
      description: description || '',
      packageType,
      duration: duration || `${numberOfDays || 1} Day${(numberOfDays || 1) > 1 ? 's' : ''}`,
      numberOfDays: Number(numberOfDays || 1),
      numberOfNights: Number(numberOfNights || 0),
      destinations: Array.isArray(destinations) ? destinations.map((item) => item.trim()).filter(Boolean) : [],
      pickupLocation: pickupLocation || '',
      dropLocation: dropLocation || '',
      vehicleType: vehicleType || '',
      maxPassengers: Number(maxPassengers || 1),
      basePrice: Number(basePrice || 0),
      priceType: priceType || 'Per Trip',
      inclusions: Array.isArray(inclusions) ? inclusions.map((item) => item.trim()).filter(Boolean) : [],
      exclusions: Array.isArray(exclusions) ? exclusions.map((item) => item.trim()).filter(Boolean) : [],
      termsAndConditions: termsAndConditions || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user._id,
    });

    return successResponse(res, 201, 'Package created successfully', pkg);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create package');
  }
};

const getPackageById = async (req, res) => {
  try {
    const pkg = await Package.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!pkg) {
      return errorResponse(res, 404, 'Package not found');
    }
    return successResponse(res, 200, 'Package fetched successfully', pkg);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch package');
  }
};

const updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!pkg) {
      return errorResponse(res, 404, 'Package not found');
    }

    const fields = [
      'name', 'description', 'packageType', 'duration', 'numberOfDays', 'numberOfNights',
      'destinations', 'pickupLocation', 'dropLocation', 'vehicleType', 'maxPassengers',
      'basePrice', 'priceType', 'inclusions', 'exclusions', 'termsAndConditions', 'isActive'
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        pkg[field] = req.body[field];
      }
    });

    if (pkg.name) pkg.name = pkg.name.trim();
    if (pkg.duration) pkg.duration = pkg.duration.trim();

    await pkg.save();
    return successResponse(res, 200, 'Package updated successfully', pkg);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update package');
  }
};

const updatePackageStatus = async (req, res) => {
  try {
    const pkg = await Package.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!pkg) {
      return errorResponse(res, 404, 'Package not found');
    }

    const { isActive } = req.body;
    pkg.isActive = isActive !== undefined ? Boolean(isActive) : !pkg.isActive;
    await pkg.save();

    return successResponse(res, 200, 'Package status updated successfully', pkg);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update package status');
  }
};

module.exports = {
  getPackages,
  createPackage,
  getPackageById,
  updatePackage,
  updatePackageStatus,
};

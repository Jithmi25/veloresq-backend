import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  next();
};

// User validation rules
export const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('phoneNumber')
    .matches(/^\+94\d{9}$/)
    .withMessage('Please provide a valid Sri Lankan phone number'),

  body('role')
    .isIn(['customer', 'garage_owner'])
    .withMessage('Role must be either customer or garage_owner'),

  body('garageName')
    .if(body('role').equals('garage_owner'))
    .notEmpty()
    .withMessage('Garage name is required for garage owners'),

  body('garageAddress')
    .if(body('role').equals('garage_owner'))
    .notEmpty()
    .withMessage('Garage address is required for garage owners')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Garage validation rules
export const validateGarage = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Garage name must be between 2 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),

  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('phoneNumber')
    .matches(/^\+94\d{9}$/)
    .withMessage('Please provide a valid Sri Lankan phone number'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

// Booking validation rules
export const validateBooking = [
  body('garageId')
    .isMongoId()
    .withMessage('Invalid garage ID'),

  body('serviceId')
    .notEmpty()
    .withMessage('Service ID is required'),

  body('scheduledDateTime')
    .isISO8601()
    .withMessage('Please provide a valid date and time'),

  body('vehicleInfo.make')
    .trim()
    .notEmpty()
    .withMessage('Vehicle make is required'),

  body('vehicleInfo.model')
    .trim()
    .notEmpty()
    .withMessage('Vehicle model is required'),

  body('vehicleInfo.year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Please provide a valid vehicle year'),

  body('vehicleInfo.licensePlate')
    .trim()
    .notEmpty()
    .withMessage('License plate is required')
];

// Emergency validation rules
export const validateEmergency = [
  body('type')
    .isIn(['breakdown', 'accident', 'flat_tire', 'battery', 'fuel', 'lockout', 'other'])
    .withMessage('Invalid emergency type'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),

  body('contactNumber')
    .matches(/^\+94\d{9}$/)
    .withMessage('Please provide a valid Sri Lankan phone number')
];

// Pagination query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Search query validation
export const validateSearch = [
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Radius must be between 0.1 and 100 km'),

  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5')
];

// Validate ObjectId
export const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`)
];

const { ValidationError } = require('./errors');

/**
 * Validates required fields in request body
 */
const validateRequired = (data, fields, message = 'Missing required fields') => {
  const missing = fields.filter(field => !data[field] || (typeof data[field] === 'string' && data[field].trim() === ''));
  if (missing.length > 0) {
    throw new ValidationError(
      `${message}: ${missing.join(', ')}`,
      missing.map(field => `${field} is required`)
    );
  }
};

/**
 * Validates email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', ['email must be a valid email address']);
  }
};

/**
 * Validates password strength
 */
const validatePassword = (password, minLength = 6) => {
  if (!password || password.length < minLength) {
    throw new ValidationError(
      `Password must be at least ${minLength} characters long`,
      [`password must be at least ${minLength} characters`]
    );
  }
};

/**
 * Validates role
 */
const validateRole = (role) => {
  const validRoles = ['student', 'organizer'];
  if (!validRoles.includes(role)) {
    throw new ValidationError(
      `Role must be one of: ${validRoles.join(', ')}`,
      [`role must be one of: ${validRoles.join(', ')}`]
    );
  }
};

/**
 * Sanitizes string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validates MongoDB ObjectId
 */
const validateObjectId = (id) => {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('Invalid ID format', ['id must be a valid MongoDB ObjectId']);
  }
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ValidationError('Invalid ID format', ['id must be a valid MongoDB ObjectId']);
  }
};

module.exports = {
  validateRequired,
  validateEmail,
  validatePassword,
  validateRole,
  sanitizeString,
  validateObjectId,
};



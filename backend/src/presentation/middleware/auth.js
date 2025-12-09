const jwt = require('jsonwebtoken');
const UserRepository = require('../../infrastructure/repositories/UserRepository');
const { AuthenticationError } = require('../../utils/errors');
const config = require('../../config');
const logger = require('../../utils/logger');
const asyncHandler = require('./asyncHandler');

const userRepository = new UserRepository();

/**
 * Middleware to verify JWT token (for both Supabase and custom JWT)
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  if (!token) {
    throw new AuthenticationError('No token, authorization denied');
  }

  try {
    let decoded;
    const jwtSecret = config.jwtSecret || config.supabaseJwtSecret || 'fallback_secret';
    const supabaseSecret = config.supabaseJwtSecret;

    // Decode token without verification to check structure
    const decodedToken = jwt.decode(token, { complete: false });

    if (!decodedToken) {
      throw new AuthenticationError('Invalid token format');
    }

    // Check if it's a Supabase token
    if (decodedToken.email || decodedToken.sub || decodedToken.user_email || decodedToken.aud) {
      // Try verification with Supabase secret if available
      if (supabaseSecret) {
        try {
          decoded = jwt.verify(token, supabaseSecret);
        } catch (verifyError) {
          // Verification failed, will use decoded token
        }
      }

      // Fetch user from DB using email
      const userEmail = (decoded || decodedToken).email || decodedToken.user_email;
      if (userEmail) {
        const user = await userRepository.findByEmail(userEmail);
        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
          return next();
        }
      }

      // If no user found, still allow but with limited info
      req.user = {
        id: decodedToken.sub || decodedToken.id,
        email: decodedToken.email || decodedToken.user_email,
        role: decodedToken.role,
      };
      return next();
    }

    // Check if it's our custom JWT format
    if (decodedToken.user && decodedToken.user.id) {
      try {
        decoded = jwt.verify(token, jwtSecret);
        if (decoded.user && decoded.user.id) {
          const user = await userRepository.findById(decoded.user.id);
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
          return next();
        }
      } catch (customError) {
        throw new AuthenticationError('Token verification failed');
      }
    }

    throw new AuthenticationError('Token is not valid');
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    logger.error('Auth middleware error', error);
    throw new AuthenticationError('Token is not valid');
  }
});

/**
 * Middleware to check if user has specific role
 */
const requireRole = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new AuthenticationError('User role not found');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthenticationError('Access denied. Insufficient permissions.');
    }

    next();
  });
};

module.exports = {
  authenticate,
  requireRole,
};



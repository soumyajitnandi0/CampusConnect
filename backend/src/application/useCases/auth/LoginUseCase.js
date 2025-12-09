const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../../../infrastructure/repositories/UserRepository');
const { ValidationError, AuthenticationError } = require('../../../utils/errors');
const { validateRequired, validateEmail } = require('../../../utils/validation');
const config = require('../../../config');
const logger = require('../../../utils/logger');

class LoginUseCase {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute({ email, password }) {
    // Validation
    validateRequired({ email, password }, ['email', 'password']);
    validateEmail(email);

    // Find user with password
    const user = await this.userRepository.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if user has a password
    if (!user.hasPassword()) {
      throw new AuthenticationError('Please use Google Sign-In for this account');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      token,
      user: user.toJSON(),
    };
  }

  generateToken(user) {
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiration,
    });
  }
}

module.exports = LoginUseCase;



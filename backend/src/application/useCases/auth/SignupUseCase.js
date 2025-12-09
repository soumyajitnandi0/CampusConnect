const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../../../infrastructure/repositories/UserRepository');
const { ValidationError } = require('../../../utils/errors');
const { validateRequired, validateEmail, validatePassword, validateRole } = require('../../../utils/validation');
const config = require('../../../config');
const logger = require('../../../utils/logger');

class SignupUseCase {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute({ name, email, password, role, rollNo, yearSection }) {
    // Validation
    validateRequired({ name, email, password, role }, ['name', 'email', 'password', 'role']);
    validateEmail(email);
    validatePassword(password);
    validateRole(role);

    // Additional validation for students
    if (role === 'student') {
      validateRequired({ rollNo, yearSection }, ['rollNo', 'yearSection'], 'Students must provide rollNo and yearSection');
    }

    // Check if user already exists
    const userExists = await this.userRepository.existsByEmail(email);
    if (userExists) {
      throw new ValidationError('User already exists with this email', ['email already exists']);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user data
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
    };

    if (role === 'student') {
      userData.rollNo = rollNo.trim();
      userData.yearSection = yearSection.trim();
    }

    // Create user
    const user = await this.userRepository.create(userData);

    // Generate JWT token
    const token = this.generateToken(user);

    logger.info('User signed up successfully', { userId: user.id, email: user.email, role: user.role });

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

module.exports = SignupUseCase;



const UserModel = require('../../../models/User');
const User = require('../../domain/entities/User');
const { NotFoundError, ConflictError } = require('../../utils/errors');
const logger = require('../../utils/logger');

class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      const userDoc = await UserModel.findOne({ email }).select('-password');
      return userDoc ? this.toDomain(userDoc) : null;
    } catch (error) {
      logger.error('Error finding user by email', error, { email });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      const userDoc = await UserModel.findById(id).select('-password');
      if (!userDoc) {
        throw new NotFoundError('User');
      }
      return this.toDomain(userDoc);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error finding user by ID', error, { id });
      throw error;
    }
  }

  /**
   * Find user with password (for authentication)
   */
  async findByEmailWithPassword(email) {
    try {
      const userDoc = await UserModel.findOne({ email });
      return userDoc ? this.toDomain(userDoc) : null;
    } catch (error) {
      logger.error('Error finding user by email with password', error, { email });
      throw error;
    }
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email) {
    try {
      const count = await UserModel.countDocuments({ email });
      return count > 0;
    } catch (error) {
      logger.error('Error checking user existence', error, { email });
      throw error;
    }
  }

  /**
   * Create new user
   */
  async create(userData) {
    try {
      // Check if user already exists
      const exists = await this.existsByEmail(userData.email);
      if (exists) {
        throw new ConflictError('User already exists with this email');
      }

      const userDoc = new UserModel(userData);
      await userDoc.save();
      return this.toDomain(userDoc);
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      if (error.code === 11000) {
        throw new ConflictError('User already exists with this email');
      }
      logger.error('Error creating user', error, { email: userData.email });
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id, updateData) {
    try {
      const userDoc = await UserModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!userDoc) {
        throw new NotFoundError('User');
      }

      return this.toDomain(userDoc);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating user', error, { id });
      throw error;
    }
  }

  /**
   * Convert Mongoose document to domain entity
   */
  toDomain(userDoc) {
    return new User({
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      password: userDoc.password,
      googleId: userDoc.googleId,
      role: userDoc.role,
      rollNo: userDoc.rollNo,
      yearSection: userDoc.yearSection,
      points: userDoc.points,
      badges: userDoc.badges,
      createdAt: userDoc.createdAt,
    });
  }
}

module.exports = UserRepository;



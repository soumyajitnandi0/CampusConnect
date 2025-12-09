const UserRepository = require('../../../infrastructure/repositories/UserRepository');
const { ValidationError } = require('../../../utils/errors');
const { validateRole } = require('../../../utils/validation');
const logger = require('../../../utils/logger');

class SyncUserUseCase {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute({ tokenUser, role, rollNo, yearSection }) {
    // Extract email from token user (handles different token structures)
    const email = tokenUser.email || tokenUser.user_email || tokenUser.user?.email;
    const sub = tokenUser.sub || tokenUser.id || tokenUser.user_id;
    const userMetadata = tokenUser.user_metadata || tokenUser.app_metadata || {};
    const { full_name, name } = userMetadata;

    if (!email) {
      throw new ValidationError('Email not found in token', ['email is required']);
    }

    const displayName = full_name || name || email.split('@')[0];

    // Check if user exists
    let user = await this.userRepository.findByEmail(email);

    if (user) {
      // Existing user - handle role assignment
      if (user.role) {
        // User has a role - check if role matches if provided
        if (role && user.role !== role) {
          throw new ValidationError(
            `This account is already registered as a ${user.role}. Please use the correct sign-in button.`,
            ['role mismatch']
          );
        }
        // User has role and either no role provided (sign-in) or role matches
        return { user: user.toJSON() };
      } else if (!user.role && role) {
        // User exists but has no role - assign the requested role
        validateRole(role);

        const updateData = { role };
        if (role === 'student' && rollNo && yearSection) {
          updateData.rollNo = rollNo.trim();
          updateData.yearSection = yearSection.trim();
        }

        user = await this.userRepository.update(user.id, updateData);
        logger.info('Role assigned to existing user', { userId: user.id, role: user.role });
      } else if (!user.role && !role) {
        // User exists but no role provided - need role selection
        throw new ValidationError('Role is required. Please select a role.', ['role is required']);
      }
    } else {
      // New user - require role
      if (!role) {
        throw new ValidationError('Role is required for new users. Must be "student" or "organizer"', ['role is required']);
      }
      validateRole(role);

      const userData = {
        name: displayName,
        email: email.toLowerCase().trim(),
        role,
        googleId: sub,
      };

      if (role === 'student' && rollNo && yearSection) {
        userData.rollNo = rollNo.trim();
        userData.yearSection = yearSection.trim();
      }

      user = await this.userRepository.create(userData);
      logger.info('New user created via Google OAuth', { userId: user.id, email: user.email, role: user.role });
    }

    return { user: user.toJSON() };
  }
}

module.exports = SyncUserUseCase;



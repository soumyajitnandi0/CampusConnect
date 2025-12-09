/**
 * User Domain Entity
 * Represents the core User business logic
 */
class User {
  constructor({
    id,
    name,
    email,
    password,
    googleId,
    role,
    rollNo,
    yearSection,
    points = 0,
    badges = [],
    createdAt,
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.googleId = googleId;
    this.role = role;
    this.rollNo = rollNo;
    this.yearSection = yearSection;
    this.points = points;
    this.badges = badges;
    this.createdAt = createdAt;
  }

  isStudent() {
    return this.role === 'student';
  }

  isOrganizer() {
    return this.role === 'organizer';
  }

  hasPassword() {
    return !!this.password;
  }

  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;



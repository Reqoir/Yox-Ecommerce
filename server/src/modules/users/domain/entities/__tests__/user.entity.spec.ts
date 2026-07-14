/**
 * @file user.entity.spec.ts
 * @layer Domain
 * 
 * Unit tests for the User domain entity.
 */

import { User, UserStatus } from '../user.entity';

describe('User Domain Entity Unit Tests', () => {
  describe('create()', () => {
    it('should create a user instance with hashed password and default fields', async () => {
      const input = {
        fullName: 'Test User',
        email: 'TEST@example.com ', // Has uppercase and trailing space
        password: 'Password123!',
        phone: '1234567890',
        roleId: 'CUSTOMER_ROLE_ID',
      };

      const user = await User.create(input);

      // Verify basic fields are set
      expect(user.fullName).toBe('Test User');
      // Verify email is trimmed and lowercased
      expect(user.email).toBe('test@example.com');
      // Verify phone and roleId are set
      expect(user.phone).toBe('1234567890');
      expect(user.roleId).toBe('CUSTOMER_ROLE_ID');
      
      // Verify default values are set
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.isEmailVerified).toBe(false);
      expect(user.isPhoneVerified).toBe(false);
      
      // Verify password got hashed (is not equal to original text)
      expect(user.password).not.toBe('Password123!');
      expect(user.password.length).toBeGreaterThan(10);
    });
  });

  describe('canLogin()', () => {
    it('should allow login if status is ACTIVE and user is not deleted', () => {
      const user = User.reconstitute({
        id: 'user-1',
        fullName: 'Active User',
        email: 'active@example.com',
        password: 'hashedpassword',
        roleId: 'role-1',
        isEmailVerified: true,
        isPhoneVerified: false,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.canLogin()).toBe(true);
    });

    it('should deny login if status is INACTIVE', () => {
      const user = User.reconstitute({
        id: 'user-1',
        fullName: 'Inactive User',
        email: 'inactive@example.com',
        password: 'hashedpassword',
        roleId: 'role-1',
        isEmailVerified: true,
        isPhoneVerified: false,
        status: UserStatus.INACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.canLogin()).toBe(false);
    });

    it('should deny login if user is soft-deleted', () => {
      const user = User.reconstitute({
        id: 'user-1',
        fullName: 'Deleted User',
        email: 'deleted@example.com',
        password: 'hashedpassword',
        roleId: 'role-1',
        isEmailVerified: true,
        isPhoneVerified: false,
        status: UserStatus.ACTIVE,
        deletedAt: new Date(), // Soft-deleted
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.canLogin()).toBe(false);
    });
  });

  describe('updateProfile()', () => {
    it('should update permitted fields safely and change updatedAt timestamp', async () => {
      const user = await User.create({
        fullName: 'Original Name',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '12345',
        roleId: 'role-1',
      });

      const originalUpdatedAt = user.updatedAt;

      // Small delay to ensure timestamp differences if any
      await new Promise(resolve => setTimeout(resolve, 5));

      user.updateProfile({
        fullName: 'Updated Name',
        phone: '67890',
        profileImage: 'http://example.com/image.jpg',
      });

      expect(user.fullName).toBe('Updated Name');
      expect(user.phone).toBe('67890');
      expect(user.profileImage).toBe('http://example.com/image.jpg');
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});

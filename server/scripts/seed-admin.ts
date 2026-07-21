import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI as string;

// Define simple schema for role
const roleSchema = new mongoose.Schema({
  name: String,
  permissions: [String],
  isSystem: Boolean,
});
const Role = mongoose.model('Role', roleSchema);

// Define simple schema for user
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  roleId: String,
});
const User = mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        permissions: [
          'manage_brands', 
          'manage_inventory', 
          'manage_products', 
          'manage_users', 
          'manage_roles', 
          'manage_categories',
          'manage_orders',
          'manage_settings',
          'view_analytics'
        ],
        isSystem: true,
      });
      console.log('Created Admin role', adminRole._id);
    } else {
        console.log('Admin role already exists', adminRole._id);
        adminRole.permissions = [
          'manage_brands', 
          'manage_inventory', 
          'manage_products', 
          'manage_users', 
          'manage_roles', 
          'manage_categories',
          'manage_orders',
          'manage_settings',
          'view_analytics'
        ];
        await adminRole.save();
        console.log('Updated existing Admin role with all permissions');
    }

    let adminUser = await User.findOne({ email: 'admin@yox.com' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      adminUser = await User.create({
        fullName: 'System Admin',
        email: 'admin@yox.com',
        password: hashedPassword,
        roleId: adminRole._id.toString(),
      });
      console.log('Created Admin user', adminUser.email);
    } else {
      console.log('Admin user already exists');
      // If it exists, let's update password just in case
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      adminUser.password = hashedPassword;
      adminUser.roleId = adminRole._id.toString();
      await adminUser.save();
      console.log('Updated existing Admin user with default password Admin@123');
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

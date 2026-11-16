import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI as string;

// Define simple schema for role
const roleSchema = new mongoose.Schema({
  name: String,
  description: String,
  permissions: [String],
  level: Number,
  isSystem: Boolean,
});
const Role = mongoose.model('Role', roleSchema);

const rolesToSeed = [
  {
    name: 'CUSTOMER',
    description: 'Standard store customer',
    level: 0,
    permissions: [],
    isSystem: true,
  },
  {
    name: 'MANAGER',
    description: 'Store operational manager',
    level: 75,
    permissions: [
      'dashboard:read',
      'view_analytics',
      'view_reports',
      'manage_products',
      'manage_categories',
      'manage_brands',
      'manage_inventory',
      'manage_orders',
      'manage_users',
      'manage_offers',
      'manage_reviews',
      'manage_content',
      'manage_notifications',
      'view_staff',
    ],
    isSystem: true,
  },
  {
    name: 'EDITOR',
    description: 'Catalog, content, and order editor',
    level: 50,
    permissions: [
      'manage_products',
      'manage_categories',
      'manage_brands',
      'manage_content',
      'manage_reviews',
      'manage_orders',
    ],
    isSystem: true,
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    for (const roleData of rolesToSeed) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        await Role.create(roleData);
        console.log(`Created ${roleData.name} role (Level ${roleData.level})`);
      } else {
        role.permissions = roleData.permissions;
        role.description = roleData.description;
        (role as any).level = roleData.level;
        (role as any).isSystem = roleData.isSystem;
        await role.save();
        console.log(`Updated ${roleData.name} role (Level ${roleData.level}, ${roleData.permissions.length} perms)`);
      }
    }

    console.log('Seed roles completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

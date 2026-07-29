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
  isSystem: Boolean,
});
const Role = mongoose.model('Role', roleSchema);

const rolesToSeed = [
  {
    name: 'CUSTOMER',
    description: 'Standard store customer',
    permissions: [],
    isSystem: true,
  },
  {
    name: 'MANAGER',
    description: 'Store manager',
    permissions: [
      'manage_brands', 
      'manage_inventory', 
      'manage_products', 
      'manage_categories',
      'manage_orders'
    ],
    isSystem: true,
  },
  {
    name: 'EDITOR',
    description: 'Content editor',
    permissions: [
      'manage_brands', 
      'manage_categories'
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
        console.log(`Created ${roleData.name} role`);
      } else {
        role.permissions = roleData.permissions;
        role.description = roleData.description;
        await role.save();
        console.log(`Updated ${roleData.name} role`);
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

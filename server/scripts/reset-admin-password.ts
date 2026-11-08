import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI as string;

// Define simple schema for user
const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: { type: String, lowercase: true, trim: true },
    password: { type: String, select: true },
    roleId: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function resetPassword() {
  const args = process.argv.slice(2);
  let targetEmail = 'admin@yox.com';
  let newPassword = 'Admin@123';

  if (args.length === 1) {
    // If only 1 arg given, treat as new password for admin@yox.com
    newPassword = args[0];
  } else if (args.length >= 2) {
    // If 2 args given: <email> <password>
    targetEmail = args[0].toLowerCase();
    newPassword = args[1];
  }

  if (newPassword.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  try {
    console.log(`Connecting to database...`);
    await mongoose.connect(MONGODB_URI);

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      console.error(`❌ User with email "${targetEmail}" was not found in the database.`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log(`\n========================================`);
    console.log(`✅ PASSWORD RESET SUCCESSFUL!`);
    console.log(`Account:  ${user.fullName || 'Admin'} (${user.email})`);
    console.log(`New Pass: ${newPassword}`);
    console.log(`Login at: /admin-login`);
    console.log(`========================================\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    process.exit(1);
  }
}

resetPassword();


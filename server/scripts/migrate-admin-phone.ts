/**
 * @file migrate-admin-phone.ts
 * @layer Database Migration Script
 * @description Safely transfers contact phone number for the primary administrator account (admin@yox.com).
 * 
 * Target:
 *  - admin@yox.com receives verified phone 8089399521
 *  - Previous phone 7594830618 is completely unlinked and released
 *  - Existing holder of 8089399521 has its phone field released/nulled
 * 
 * Usage:
 *  Dry run (default, read-only):
 *    npx ts-node -r tsconfig-paths/register scripts/migrate-admin-phone.ts --dry-run
 *  Apply changes:
 *    npx ts-node -r tsconfig-paths/register scripts/migrate-admin-phone.ts --apply
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '/var/www/yox-ecommerce/server/.env' });
}

const MONGODB_URI = process.env.MONGODB_URI as string;
const IS_APPLY = process.argv.includes('--apply');
const IS_DRY_RUN = !IS_APPLY || process.argv.includes('--dry-run');

const OLD_ADMIN_PHONE = '7594830618';
const NEW_ADMIN_PHONE = '8089399521';
const EXPECTED_ADMIN_EMAIL = 'admin@yox.com';
const EXPECTED_ADMIN_ID = '6aeddbffc5b528381f3a8c00';

function mask(val: string | null | undefined): string {
  if (!val) return 'None';
  const s = String(val);
  return s.length > 4 ? `${s.slice(0, 2)}****${s.slice(-2)}` : '****';
}

export interface MigrationResult {
  success: boolean;
  dryRun: boolean;
  adminId: string;
  adminEmail: string;
  previousAdminPhone: string | null;
  newAdminPhone: string;
  releasedFromUserIds: string[];
  oldPhoneAvailable: boolean;
  newPhoneUniquelyOwnedByAdmin: boolean;
  errors: string[];
}

export async function runAdminPhoneMigration(options: { dryRun?: boolean; uri?: string } = {}): Promise<MigrationResult> {
  const dryRun = options.dryRun !== undefined ? options.dryRun : IS_DRY_RUN;
  const uri = options.uri || MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is required to run admin phone migration');
  }

  const shouldDisconnect = mongoose.connection.readyState === 0;
  if (shouldDisconnect) {
    await mongoose.connect(uri);
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to obtain MongoDB database reference');
  }
  const usersCollection = db.collection('users');
  const rolesCollection = db.collection('roles');

  const result: MigrationResult = {
    success: false,
    dryRun,
    adminId: '',
    adminEmail: EXPECTED_ADMIN_EMAIL,
    previousAdminPhone: null,
    newAdminPhone: NEW_ADMIN_PHONE,
    releasedFromUserIds: [],
    oldPhoneAvailable: false,
    newPhoneUniquelyOwnedByAdmin: false,
    errors: [],
  };

  try {
    console.log(`\n======================================================`);
    console.log(`  ADMINISTRATOR PHONE TRANSFER MIGRATION`);
    console.log(`  Mode: ${dryRun ? 'DRY-RUN (Read-Only Safety Check)' : 'APPLY (Live Database Modification)'}`);
    console.log(`======================================================\n`);

    // 1. Locate and validate primary administrator
    const adminUser = await usersCollection.findOne({ email: EXPECTED_ADMIN_EMAIL.toLowerCase() });
    if (!adminUser) {
      result.errors.push(`Primary administrator with email ${EXPECTED_ADMIN_EMAIL} was not found in the database.`);
      return result;
    }

    result.adminId = adminUser._id.toString();
    result.previousAdminPhone = adminUser.phone || null;

    console.log(`[1] Primary Administrator Found:`);
    console.log(`    - ID:    ${result.adminId}`);
    console.log(`    - Email: ${adminUser.email}`);
    console.log(`    - Status: ${adminUser.status}`);
    console.log(`    - Current Phone: ${mask(adminUser.phone)}`);

    if (result.adminId !== EXPECTED_ADMIN_ID) {
      console.warn(`    ⚠️  Warning: Administrator ID (${result.adminId}) differs from standard seed ID (${EXPECTED_ADMIN_ID}).`);
    }

    // 2. Identify all existing holders of NEW_ADMIN_PHONE (8089399521)
    const newPhoneRegex = new RegExp(`${NEW_ADMIN_PHONE.slice(-10)}$`);
    const newPhoneHolders = await usersCollection.find({
      phone: { $regex: newPhoneRegex },
      _id: { $ne: adminUser._id },
    }).toArray();

    console.log(`\n[2] Existing Holders of Target Phone (${mask(NEW_ADMIN_PHONE)}):`);
    if (newPhoneHolders.length === 0) {
      console.log(`    - No other user currently holds target phone.`);
    } else {
      newPhoneHolders.forEach((u) => {
        result.releasedFromUserIds.push(u._id.toString());
        console.log(`    - User ID: ${u._id.toString()} | Name: ${u.fullName} | Status: ${u.status} | DeletedAt: ${u.deletedAt || 'null'}`);
      });
    }

    // 3. Identify all existing holders of OLD_ADMIN_PHONE (7594830618)
    const oldPhoneRegex = new RegExp(`${OLD_ADMIN_PHONE.slice(-10)}$`);
    const oldPhoneHolders = await usersCollection.find({
      phone: { $regex: oldPhoneRegex },
    }).toArray();

    console.log(`\n[3] Current Holders of Old Phone (${mask(OLD_ADMIN_PHONE)}):`);
    oldPhoneHolders.forEach((u) => {
      console.log(`    - User ID: ${u._id.toString()} | Email: ${u.email || 'None'} | Status: ${u.status}`);
    });

    // 4. Execution Plan Summary
    console.log(`\n[4] Proposed Transfer Actions:`);
    if (newPhoneHolders.length > 0) {
      console.log(`    - Release target phone (${mask(NEW_ADMIN_PHONE)}) from ${newPhoneHolders.length} account(s):`);
      newPhoneHolders.forEach((u) => console.log(`      * Set phone = null on user ${u._id.toString()}`));
    }
    console.log(`    - Update admin user (${result.adminId}):`);
    console.log(`      * Old Phone: ${mask(adminUser.phone)} -> REMOVED`);
    console.log(`      * New Phone: ${mask(NEW_ADMIN_PHONE)} -> ASSIGNED (isPhoneVerified: true)`);
    console.log(`    - Release old phone (${mask(OLD_ADMIN_PHONE)}) -> AVAILABLE for new customer registration`);

    if (dryRun) {
      console.log(`\n[DRY RUN COMPLETE] Zero database changes were written.`);
      result.success = true;
      result.oldPhoneAvailable = true;
      result.newPhoneUniquelyOwnedByAdmin = true;
      return result;
    }

    // 5. Apply Changes in Safe Sequence
    console.log(`\n[5] Executing Live Migration...`);

    // A. Release target phone from existing holders
    if (newPhoneHolders.length > 0) {
      for (const holder of newPhoneHolders) {
        await usersCollection.updateOne(
          { _id: holder._id },
          { 
            $unset: { phone: '' },
            $set: { updatedAt: new Date() },
          }
        );
        console.log(`    ✓ Released phone from user ${holder._id.toString()}`);
      }
    }

    // B. Assign target phone to admin and remove old phone
    const updateRes = await usersCollection.updateOne(
      { _id: adminUser._id },
      {
        $set: {
          phone: NEW_ADMIN_PHONE,
          isPhoneVerified: true,
          updatedAt: new Date(),
        },
      }
    );

    if (updateRes.matchedCount !== 1) {
      throw new Error(`Failed to update administrator document`);
    }
    console.log(`    ✓ Assigned ${mask(NEW_ADMIN_PHONE)} to administrator ${adminUser.email}`);

    // 6. Post-Migration Uniqueness Verification
    const postOldCheck = await usersCollection.find({ phone: { $regex: oldPhoneRegex } }).toArray();
    const postNewCheck = await usersCollection.find({ phone: { $regex: newPhoneRegex } }).toArray();

    result.oldPhoneAvailable = postOldCheck.length === 0;
    result.newPhoneUniquelyOwnedByAdmin = postNewCheck.length === 1 && postNewCheck[0]._id.toString() === adminUser._id.toString();

    console.log(`\n[6] Post-Migration Safety Verification:`);
    console.log(`    - Old phone (${mask(OLD_ADMIN_PHONE)}) count in DB: ${postOldCheck.length} (Expected: 0) -> ${result.oldPhoneAvailable ? 'PASS' : 'FAIL'}`);
    console.log(`    - New phone (${mask(NEW_ADMIN_PHONE)}) count in DB: ${postNewCheck.length} (Expected: 1, owned by admin) -> ${result.newPhoneUniquelyOwnedByAdmin ? 'PASS' : 'FAIL'}`);

    if (!result.oldPhoneAvailable || !result.newPhoneUniquelyOwnedByAdmin) {
      throw new Error(`Post-migration validation check failed! Old phone count: ${postOldCheck.length}, New phone count: ${postNewCheck.length}`);
    }

    result.success = true;
    console.log(`\n✓ Admin phone transfer completed successfully!`);
    return result;
  } catch (err: any) {
    result.errors.push(err.message || String(err));
    console.error(`\n❌ Migration failed with error:`, err);
    return result;
  } finally {
    if (shouldDisconnect) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runAdminPhoneMigration()
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

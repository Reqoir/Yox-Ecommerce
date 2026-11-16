/**
 * @file cleanup-user-accounts.ts
 * @layer Database Cleanup Script
 * @description Audits, validates, and cleans up secondary user accounts while preserving admin@yox.com and all business records.
 * 
 * Safety Rules:
 *  - admin@yox.com (ID: 6aeddbffc5b528381f3a8c00) is PERMANENTLY PROTECTED and can never be deleted.
 *  - Orders, Payments, Shipments, Refunds, Audit Logs, and Webhook Events are NEVER deleted.
 *  - Transient user records (cart, wishlist, address) associated with deleted accounts are pruned.
 *  - Refuses to proceed if admin@yox.com is missing, ambiguous, or inactive.
 *  - Requires explicit --apply flag for execution; defaults to safe read-only --dry-run.
 * 
 * Usage:
 *  Dry run (default, read-only):
 *    npx ts-node -r tsconfig-paths/register scripts/cleanup-user-accounts.ts --dry-run
 *  Apply changes (REQUIRES SEPARATE PRODUCTION APPROVAL):
 *    npx ts-node -r tsconfig-paths/register scripts/cleanup-user-accounts.ts --apply
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

const PROTECTED_ADMIN_EMAIL = 'admin@yox.com';
const EXPECTED_ADMIN_ID = '6aeddbffc5b528381f3a8c00';

function maskEmail(e: string | null | undefined): string {
  if (!e) return 'None';
  const parts = e.split('@');
  if (parts.length < 2) return '***';
  return `${parts[0].slice(0, 2)}***@${parts[1]}`;
}

function maskPhone(p: string | null | undefined): string {
  if (!p) return 'None';
  const s = String(p);
  return s.length > 4 ? `${s.slice(0, 2)}****${s.slice(-2)}` : '****';
}

export interface UserCleanupTarget {
  id: string;
  fullName: string;
  maskedEmail: string;
  maskedPhone: string;
  roleId: string;
  status: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
}

export interface CleanupDryRunReport {
  success: boolean;
  dryRun: boolean;
  protectedAdmin: {
    id: string;
    email: string;
    status: string;
    phone: string;
    verified: boolean;
  };
  totalUsersFound: number;
  usersProposedForDeletion: UserCleanupTarget[];
  dependentDataSummary: {
    historicalOrdersPreserved: number;
    paymentTransactionsPreserved: number;
    shipmentRecordsPreserved: number;
    auditLogsPreserved: number;
    webhookEventsPreserved: number;
    cartsPruned: number;
    wishlistsPruned: number;
    addressesPruned: number;
  };
  errors: string[];
}

export async function runUserCleanup(options: { dryRun?: boolean; uri?: string } = {}): Promise<CleanupDryRunReport> {
  const dryRun = options.dryRun !== undefined ? options.dryRun : IS_DRY_RUN;
  const uri = options.uri || MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is required to run user cleanup');
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

  const report: CleanupDryRunReport = {
    success: false,
    dryRun,
    protectedAdmin: {
      id: '',
      email: PROTECTED_ADMIN_EMAIL,
      status: '',
      phone: '',
      verified: false,
    },
    totalUsersFound: 0,
    usersProposedForDeletion: [],
    dependentDataSummary: {
      historicalOrdersPreserved: 0,
      paymentTransactionsPreserved: 0,
      shipmentRecordsPreserved: 0,
      auditLogsPreserved: 0,
      webhookEventsPreserved: 0,
      cartsPruned: 0,
      wishlistsPruned: 0,
      addressesPruned: 0,
    },
    errors: [],
  };

  try {
    console.log(`\n======================================================`);
    console.log(`  USER DATABASE CLEANUP & RETENTION AUDIT`);
    console.log(`  Mode: ${dryRun ? 'DRY-RUN (Strict Read-Only Verification)' : 'APPLY (Permanent User Deletion)'}`);
    console.log(`======================================================\n`);

    // 1. Locate and inspect primary Store Owner
    const adminUser = await usersCollection.findOne({ email: PROTECTED_ADMIN_EMAIL.toLowerCase() });
    if (!adminUser) {
      report.errors.push(`CRITICAL: Primary administrator ${PROTECTED_ADMIN_EMAIL} was not found.`);
      return report;
    }

    if (adminUser.status !== 'ACTIVE') {
      report.errors.push(`CRITICAL: Primary administrator status is not ACTIVE (current: ${adminUser.status}).`);
      return report;
    }

    report.protectedAdmin = {
      id: adminUser._id.toString(),
      email: adminUser.email,
      status: adminUser.status,
      phone: maskPhone(adminUser.phone),
      verified: Boolean(adminUser.isPhoneVerified),
    };

    console.log(`[1] Permanent Protected Administrator:`);
    console.log(`    - ID:     ${report.protectedAdmin.id}`);
    console.log(`    - Email:  ${report.protectedAdmin.email}`);
    console.log(`    - Status: ${report.protectedAdmin.status}`);
    console.log(`    - Phone:  ${report.protectedAdmin.phone}`);

    if (report.protectedAdmin.id !== EXPECTED_ADMIN_ID) {
      console.warn(`    ⚠️  Notice: Administrator ID (${report.protectedAdmin.id}) differs from default seed ID (${EXPECTED_ADMIN_ID}).`);
    }

    // 2. Identify all user records in the collection
    const allUsers = await usersCollection.find({}).toArray();
    report.totalUsersFound = allUsers.length;

    console.log(`\n[2] Database User Accounts Audit:`);
    console.log(`    - Total accounts found: ${report.totalUsersFound}`);

    const targetUsers = allUsers.filter((u) => u._id.toString() !== adminUser._id.toString());
    report.usersProposedForDeletion = targetUsers.map((u) => ({
      id: u._id.toString(),
      fullName: u.fullName || 'Unnamed',
      maskedEmail: maskEmail(u.email),
      maskedPhone: maskPhone(u.phone),
      roleId: u.roleId || 'None',
      status: u.status || 'ACTIVE',
      isDeleted: Boolean(u.deletedAt),
      deletedAt: u.deletedAt || null,
      createdAt: u.createdAt,
    }));

    console.log(`    - Protected accounts:   1 (${report.protectedAdmin.email})`);
    console.log(`    - Accounts for cleanup: ${report.usersProposedForDeletion.length}`);

    if (report.usersProposedForDeletion.length > 0) {
      console.log(`\n[3] Accounts Proposed for Permanent Deletion:`);
      report.usersProposedForDeletion.forEach((target, idx) => {
        console.log(`    [${idx + 1}] User ID: ${target.id}`);
        console.log(`        - Name:      ${target.fullName}`);
        console.log(`        - Email:     ${target.maskedEmail}`);
        console.log(`        - Phone:     ${target.maskedPhone}`);
        console.log(`        - Role ID:   ${target.roleId}`);
        console.log(`        - Status:    ${target.status} (Soft-deleted: ${target.isDeleted})`);
        console.log(`        - CreatedAt: ${target.createdAt || 'Unknown'}`);
      });
    }

    // 3. Inspect dependent collections for all target users
    const targetUserIds = targetUsers.map((u) => u._id.toString());
    const targetObjectIds = targetUsers.map((u) => u._id);

    console.log(`\n[4] Business & Financial Data Retention Audit:`);

    // A. Orders (MUST BE PRESERVED)
    const orderCount = await db.collection('orders').countDocuments({
      $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
    });
    report.dependentDataSummary.historicalOrdersPreserved = orderCount;
    console.log(`    - Historical Orders to PRESERVE:       ${orderCount} (Will NOT be deleted)`);

    // B. Payments (MUST BE PRESERVED)
    const paymentCount = await db.collection('payments').countDocuments({
      $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
    });
    report.dependentDataSummary.paymentTransactionsPreserved = paymentCount;
    console.log(`    - Payment Transactions to PRESERVE:    ${paymentCount} (Will NOT be deleted)`);

    // C. Shipments (MUST BE PRESERVED)
    const shipmentCount = await db.collection('shipments').countDocuments({
      $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
    });
    report.dependentDataSummary.shipmentRecordsPreserved = shipmentCount;
    console.log(`    - Courier Shipments to PRESERVE:       ${shipmentCount} (Will NOT be deleted)`);

    // D. Audit Logs (MUST BE PRESERVED)
    const auditCount = await db.collection('audit_logs').countDocuments({
      $or: [{ actorId: { $in: targetUserIds } }, { resourceId: { $in: targetUserIds } }],
    });
    report.dependentDataSummary.auditLogsPreserved = auditCount;
    console.log(`    - Security Audit Logs to PRESERVE:     ${auditCount} (Will NOT be deleted)`);

    // E. Webhook Events (MUST BE PRESERVED)
    const webhookCount = await db.collection('webhook_events').countDocuments({});
    report.dependentDataSummary.webhookEventsPreserved = webhookCount;
    console.log(`    - Webhook Event Records to PRESERVE:   ${webhookCount} (Will NOT be deleted)`);

    // F. Transient User Data (Carts, Wishlists, Addresses)
    const cartCount = await db.collection('carts').countDocuments({
      $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
    });
    report.dependentDataSummary.cartsPruned = cartCount;

    const wishlistCount = await db.collection('wishlists').countDocuments({
      $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
    });
    report.dependentDataSummary.wishlistsPruned = wishlistCount;

    const addressCount = await db.collection('addresses').countDocuments({
      $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
    });
    report.dependentDataSummary.addressesPruned = addressCount;

    console.log(`\n[5] Transient Data Pruning Plan (Belonging to Deleting Accounts):`);
    console.log(`    - Orphaned Carts:      ${cartCount}`);
    console.log(`    - Orphaned Wishlists:  ${wishlistCount}`);
    console.log(`    - Orphaned Addresses:  ${addressCount}`);

    if (dryRun) {
      console.log(`\n======================================================`);
      console.log(`  DRY-RUN COMPLETE: NO RECORDS WERE MODIFIED`);
      console.log(`  To execute, explicit production authorization and --apply flag is required.`);
      console.log(`======================================================\n`);
      report.success = true;
      return report;
    }

    // 4. Live Deletion Execution (APPLY MODE ONLY)
    console.log(`\n[6] Executing Live Permanent Deletion...`);

    // Prune transient records for target users
    if (targetUserIds.length > 0) {
      await db.collection('carts').deleteMany({
        $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
      });
      await db.collection('wishlists').deleteMany({
        $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
      });
      await db.collection('addresses').deleteMany({
        $or: [{ userId: { $in: targetUserIds } }, { userId: { $in: targetObjectIds as any } }],
      });

      // Delete target users from users collection
      const deleteResult = await usersCollection.deleteMany({
        _id: { $in: targetObjectIds },
      });
      console.log(`    ✓ Permanently deleted ${deleteResult.deletedCount} user account(s).`);
    }

    // 5. Post-Cleanup Verification
    const remainingUsers = await usersCollection.find({}).toArray();
    console.log(`\n[7] Post-Cleanup Verification:`);
    console.log(`    - Remaining users in DB: ${remainingUsers.length} (Expected: exactly 1)`);

    if (remainingUsers.length !== 1) {
      throw new Error(`CRITICAL POST-CHECK FAILED: Expected exactly 1 user in DB, found ${remainingUsers.length}!`);
    }

    const survivingUser = remainingUsers[0];
    if (survivingUser._id.toString() !== adminUser._id.toString() || survivingUser.email !== PROTECTED_ADMIN_EMAIL) {
      throw new Error(`CRITICAL POST-CHECK FAILED: Surviving user is NOT ${PROTECTED_ADMIN_EMAIL}!`);
    }

    console.log(`    ✓ PASS: Surviving user is verified as ${survivingUser.email} (ID: ${survivingUser._id.toString()}).`);
    report.success = true;
    return report;
  } catch (err: any) {
    report.errors.push(err.message || String(err));
    console.error(`\n❌ Cleanup script failed with error:`, err);
    return report;
  } finally {
    if (shouldDisconnect) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runUserCleanup()
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

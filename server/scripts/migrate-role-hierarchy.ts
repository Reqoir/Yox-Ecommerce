/**
 * @file migrate-role-hierarchy.ts
 * @layer Database Migration Script
 * @description Synchronizes the 4 system roles (System Admin, Manager, Editor, Customer) with their exact ranks and permissions in MongoDB.
 * 
 * Target Hierarchy:
 *  - System Admin: Rank 100, isSystem: true, 18/18 permissions
 *  - Manager:      Rank 75,  isSystem: true, 14/18 permissions
 *  - Editor:       Rank 50,  isSystem: true, 6/18 permissions
 *  - Customer:     Rank 0,   isSystem: true, 0/18 permissions
 * 
 * Usage:
 *  Dry run (default, read-only):
 *    npx ts-node -r tsconfig-paths/register scripts/migrate-role-hierarchy.ts --dry-run
 *  Apply changes:
 *    npx ts-node -r tsconfig-paths/register scripts/migrate-role-hierarchy.ts --apply
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { TARGET_SYSTEM_ROLES, SYSTEM_PERMISSIONS } from '../src/modules/roles/domain/constants/role.constants';

dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '/var/www/yox-ecommerce/server/.env' });
}

const MONGODB_URI = process.env.MONGODB_URI as string;
const IS_APPLY = process.argv.includes('--apply');
const IS_DRY_RUN = !IS_APPLY || process.argv.includes('--dry-run');

export { TARGET_SYSTEM_ROLES, SYSTEM_PERMISSIONS };

export interface RoleMigrationSummary {
  roleName: string;
  previousLevel: number | undefined;
  targetLevel: number;
  previousPermissionsCount: number;
  targetPermissionsCount: number;
  permissionsAdded: string[];
  permissionsRemoved: string[];
  status: 'UNCHANGED' | 'UPDATED' | 'CREATED';
}

export interface HierarchyMigrationResult {
  success: boolean;
  dryRun: boolean;
  rolesSummary: RoleMigrationSummary[];
  errors: string[];
}

export async function runRoleHierarchyMigration(options: { dryRun?: boolean; uri?: string } = {}): Promise<HierarchyMigrationResult> {
  const dryRun = options.dryRun !== undefined ? options.dryRun : IS_DRY_RUN;
  const uri = options.uri || MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is required to run role hierarchy migration');
  }

  const shouldDisconnect = mongoose.connection.readyState === 0;
  if (shouldDisconnect) {
    await mongoose.connect(uri);
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to obtain MongoDB database reference');
  }
  const rolesCollection = db.collection('roles');

  const result: HierarchyMigrationResult = {
    success: false,
    dryRun,
    rolesSummary: [],
    errors: [],
  };

  try {
    console.log(`\n======================================================`);
    console.log(`  ROLE HIERARCHY & PERMISSION SYNCHRONIZATION`);
    console.log(`  Mode: ${dryRun ? 'DRY-RUN (Read-Only Inspection)' : 'APPLY (Live Database Update)'}`);
    console.log(`======================================================\n`);

    for (const target of TARGET_SYSTEM_ROLES) {
      // Find role by canonical name or case-insensitive name
      const existing = await rolesCollection.findOne({
        name: { $regex: new RegExp(`^${target.name}$`, 'i') },
      });

      const currentPerms: string[] = existing?.permissions || [];
      const currentLevel: number | undefined = existing?.level;

      const permsToAdd = target.permissions.filter((p) => !currentPerms.includes(p));
      const permsToRemove = currentPerms.filter((p) => !target.permissions.includes(p));

      const hasLevelDiff = currentLevel !== target.level;
      const hasPermDiff = permsToAdd.length > 0 || permsToRemove.length > 0;
      const hasSystemDiff = existing?.isSystem !== target.isSystem;

      let status: 'UNCHANGED' | 'UPDATED' | 'CREATED' = 'UNCHANGED';
      if (!existing) {
        status = 'CREATED';
      } else if (hasLevelDiff || hasPermDiff || hasSystemDiff) {
        status = 'UPDATED';
      }

      result.rolesSummary.push({
        roleName: target.name,
        previousLevel: currentLevel,
        targetLevel: target.level,
        previousPermissionsCount: currentPerms.length,
        targetPermissionsCount: target.permissions.length,
        permissionsAdded: permsToAdd,
        permissionsRemoved: permsToRemove,
        status,
      });

      console.log(`Role: [${target.name}]`);
      console.log(`  - Status:                   ${status}`);
      console.log(`  - Rank / Level:             ${currentLevel ?? 'unmigrated'} -> ${target.level}`);
      console.log(`  - Permissions Count:        ${currentPerms.length} -> ${target.permissions.length}`);
      if (permsToAdd.length > 0) {
        console.log(`  - Permissions to Add (+):   ${permsToAdd.join(', ')}`);
      }
      if (permsToRemove.length > 0) {
        console.log(`  - Permissions to Remove (-):${permsToRemove.join(', ')}`);
      }
      console.log(``);

      if (!dryRun) {
        if (!existing) {
          await rolesCollection.insertOne({
            name: target.name,
            description: target.description,
            level: target.level,
            isSystem: target.isSystem,
            permissions: target.permissions,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`  ✓ Created role ${target.name}`);
        } else {
          await rolesCollection.updateOne(
            { _id: existing._id },
            {
              $set: {
                description: target.description,
                level: target.level,
                isSystem: target.isSystem,
                permissions: target.permissions,
                updatedAt: new Date(),
              },
            }
          );
          console.log(`  ✓ Updated role ${target.name}`);
        }
      }
    }

    if (dryRun) {
      console.log(`[DRY RUN COMPLETE] Zero database changes were written.`);
      result.success = true;
      return result;
    }

    // Post-migration check
    console.log(`\n[Validation] Verifying migrated role hierarchy...`);
    const allRoles = await rolesCollection.find({}).toArray();
    for (const target of TARGET_SYSTEM_ROLES) {
      const saved = allRoles.find((r) => r.name?.toUpperCase() === target.name.toUpperCase());
      if (!saved) {
        throw new Error(`Role ${target.name} missing after migration!`);
      }
      if (saved.level !== target.level) {
        throw new Error(`Role ${target.name} level mismatch: expected ${target.level}, got ${saved.level}`);
      }
      if (saved.permissions?.length !== target.permissions.length) {
        throw new Error(`Role ${target.name} permissions count mismatch: expected ${target.permissions.length}, got ${saved.permissions?.length}`);
      }
    }

    console.log(`✓ All 4 system roles verified: System Admin (100, 18/18), Manager (75, 14/18), Editor (50, 6/18), Customer (0, 0/18).`);
    result.success = true;
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
  runRoleHierarchyMigration()
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

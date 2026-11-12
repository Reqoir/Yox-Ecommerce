/**
 * @file migrate-phase1-indexes.ts
 * @description Safe, idempotent preflight check & index migration for Phase 1 financial/webhook unique indexes.
 *
 * Usage:
 *   Dry-run preflight (read-only, default):
 *     npx tsx scripts/migrate-phase1-indexes.ts
 *   Apply missing indexes (only proceeds if preflight finds zero duplicates/conflicts):
 *     npx tsx scripts/migrate-phase1-indexes.ts --apply
 *
 * Safety guarantees:
 *   - Never runs syncIndexes()
 *   - Never drops existing indexes automatically
 *   - Never deletes or mutates collection documents
 *   - Never logs MONGODB_URI or secrets
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

interface IndexSpec {
  collectionName: string;
  label: string;
  key: Record<string, 1 | -1>;
  options: {
    unique: true;
    partialFilterExpression?: Record<string, any>;
  };
  duplicateFields: string[];
  checkEmptyStringField?: string;
}

const PHASE1_INDEX_SPECS: IndexSpec[] = [
  {
    collectionName: 'payments',
    label: 'payments.transactionId (partial unique string)',
    key: { transactionId: 1 },
    options: {
      unique: true,
      partialFilterExpression: { transactionId: { $type: 'string' } },
    },
    duplicateFields: ['transactionId'],
    checkEmptyStringField: 'transactionId',
  },
  {
    collectionName: 'payments',
    label: 'payments.gatewayOrderId (partial unique string)',
    key: { gatewayOrderId: 1 },
    options: {
      unique: true,
      partialFilterExpression: { gatewayOrderId: { $type: 'string' } },
    },
    duplicateFields: ['gatewayOrderId'],
    checkEmptyStringField: 'gatewayOrderId',
  },
  {
    collectionName: 'refunds',
    label: 'refunds.gatewayRefundId (partial unique string)',
    key: { gatewayRefundId: 1 },
    options: {
      unique: true,
      partialFilterExpression: { gatewayRefundId: { $type: 'string' } },
    },
    duplicateFields: ['gatewayRefundId'],
    checkEmptyStringField: 'gatewayRefundId',
  },
  {
    collectionName: 'refunds',
    label: 'refunds.returnId (partial unique string, allows direct refunds with returnId=null)',
    key: { returnId: 1 },
    options: {
      unique: true,
      partialFilterExpression: { returnId: { $type: 'string' } },
    },
    duplicateFields: ['returnId'],
    checkEmptyStringField: 'returnId',
  },
  {
    collectionName: 'webhook_events',
    label: 'webhook_events.(provider, eventId) (compound unique)',
    key: { provider: 1, eventId: 1 },
    options: {
      unique: true,
    },
    duplicateFields: ['provider', 'eventId'],
  },
];

function stableKeyMatch(a: Record<string, any>, b: Record<string, any>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k, i) => k === keysB[i] && a[k] === b[k]);
}

function canonicalize(value: any): any {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (!value || typeof value !== 'object') {
    return value ?? null;
  }
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = canonicalize(value[key]);
  }
  return sorted;
}

function stableJson(value: any): string {
  return JSON.stringify(canonicalize(value));
}

async function run(): Promise<void> {
  const applyMode = process.argv.includes('--apply');
  const mongoUri = (process.env.MONGODB_URI || '').trim();

  if (!mongoUri) {
    console.error('Error: MONGODB_URI is not set in environment or server/.env.');
    process.exit(1);
  }

  console.log(`[Phase1 Index Preflight] Mode: ${applyMode ? 'APPLY (creates missing indexes if clean)' : 'DRY-RUN (read-only)'}`);

  try {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
        family: 4,
      });
    } catch (connErr: any) {
      console.error('[Phase1 Index Preflight] MongoDB connection failed:', connErr?.message || 'Unable to connect');
      process.exitCode = 1;
      return;
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection handle unavailable');
    }

    const existingCollections = new Set((await db.listCollections().toArray()).map((c) => c.name));

    let hasBlockers = false;
    const toCreate: IndexSpec[] = [];

    for (const spec of PHASE1_INDEX_SPECS) {
      console.log(`\nChecking ${spec.label}...`);
      const collectionExists = existingCollections.has(spec.collectionName);
      if (!collectionExists) {
        console.log(`  - Collection "${spec.collectionName}" does not exist yet (no duplicates/conflicts).`);
        toCreate.push(spec);
        continue;
      }

      const collection = db.collection(spec.collectionName);

      // 1. Duplicate non-null value check
      const matchStage: Record<string, any> = {};
      const groupId: Record<string, string> = {};
      for (const field of spec.duplicateFields) {
        matchStage[field] = { $exists: true, $ne: null };
        groupId[field] = `$${field}`;
      }

      const dupPipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: spec.duplicateFields.length === 1 ? `$${spec.duplicateFields[0]}` : groupId,
            count: { $sum: 1 },
            docIds: { $push: '$_id' },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 20 },
      ];

      const duplicates = await collection.aggregate(dupPipeline).toArray();
      if (duplicates.length > 0) {
        hasBlockers = true;
        console.error(`  [BLOCKER] Found ${duplicates.length}+ duplicate non-null key group(s):`);
        for (const dup of duplicates) {
          console.error(`    - key=${JSON.stringify(dup._id)} count=${dup.count} docIds=${JSON.stringify(dup.docIds)}`);
        }
      } else {
        console.log('  - Duplicate non-null records: NONE');
      }

      // 2. Empty string check (relevant because partialFilterExpression checks $type: 'string')
      if (spec.checkEmptyStringField) {
        const emptyCount = await collection.countDocuments({
          [spec.checkEmptyStringField]: { $type: 'string', $regex: /^\s*$/ },
        });
        if (emptyCount > 0) {
          hasBlockers = true;
          console.error(
            `  [BLOCKER] Found ${emptyCount} document(s) where "${spec.checkEmptyStringField}" is an empty/whitespace string (normalize to null before creating partial unique index).`
          );
        } else {
          console.log(`  - Empty/whitespace "${spec.checkEmptyStringField}" strings: NONE`);
        }
      }

      // 3. Existing index compatibility check
      const indexes = await collection.indexes();
      const sameKeyIndexes = indexes.filter((idx) => stableKeyMatch(idx.key as Record<string, any>, spec.key));

      if (sameKeyIndexes.length === 0) {
        console.log('  - Index status: MISSING (safe to create if preflight passes)');
        toCreate.push(spec);
      } else {
        const expectedPartial = stableJson(spec.options.partialFilterExpression);

        for (const existing of sameKeyIndexes) {
          const existingPartial = stableJson((existing as any).partialFilterExpression);
          const sameUnique = Boolean((existing as any).unique) === true;
          const samePartial = existingPartial === expectedPartial;
          const hasSparseConflict = Boolean((existing as any).sparse) && Boolean(spec.options.partialFilterExpression);

          if (sameUnique && samePartial && !hasSparseConflict) {
            console.log(`  - Index status: ALREADY PRESENT and compatible (name="${existing.name}")`);
          } else {
            hasBlockers = true;
            console.error(
              `  [CONFLICT] Existing index "${existing.name}" has incompatible options: unique=${Boolean((existing as any).unique)}, sparse=${Boolean((existing as any).sparse)}, partialFilterExpression=${existingPartial} (expected unique=true, partialFilterExpression=${expectedPartial}). Review and drop manually before recreating.`
            );
          }
        }
      }
    }

    if (hasBlockers) {
      console.error('\n[Result] PREFLIGHT FAILED: Resolve blockers/conflicts above before applying indexes.');
      process.exitCode = 1;
      return;
    }

    if (toCreate.length === 0) {
      console.log('\n[Result] PREFLIGHT PASSED: All Phase 1 unique indexes are already in place and conflict-free.');
      return;
    }

    if (!applyMode) {
      console.log(`\n[Result] PREFLIGHT PASSED (dry-run): ${toCreate.length} index(es) ready to create. Re-run with --apply to create them.`);
      return;
    }

    console.log(`\n[Apply] Creating ${toCreate.length} missing Phase 1 index(es)...`);
    for (const spec of toCreate) {
      const collection = db.collection(spec.collectionName);
      try {
        const indexName = await collection.createIndex(spec.key, {
          ...spec.options,
          background: true,
        });
        console.log(`  - Created "${indexName}" on "${spec.collectionName}"`);
      } catch (idxErr: any) {
        console.error(
          `  [Apply Failed] Could not create index ${spec.label} on "${spec.collectionName}": ${idxErr?.message || idxErr}`
        );
        process.exitCode = 1;
        return;
      }
    }
    console.log('\n[Result] Migration completed cleanly.');
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}

run().catch((err) => {
  console.error('[Phase1 Index Preflight] Fatal error:', err?.message || err);
  process.exit(1);
});

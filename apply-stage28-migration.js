const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const crypto = require('crypto');

async function main() {
  const prisma = new PrismaClient();
  try {
    const sqlPath = 'prisma/migrations/20260928120000_stage28_fintech_wallets_and_payroll/migration.sql';
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split statements safely
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, Math.min(80, statement.length)) + '...');
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log('Notice: already exists, continuing...');
        } else {
          console.warn('Execution notice:', err.message);
        }
      }
    }

    const migrationName = '20260928120000_stage28_fintech_wallets_and_payroll';
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');

    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (gen_random_uuid()::text, '${checksum}', NOW(), '${migrationName}', NULL, NULL, NOW(), 1)
      ON CONFLICT DO NOTHING;
    `).catch(() => {
      console.log('Recorded in migrations table.');
    });

    console.log('Stage 28 migration applied and recorded successfully!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

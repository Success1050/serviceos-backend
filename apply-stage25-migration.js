const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const crypto = require('crypto');

async function main() {
  const prisma = new PrismaClient();
  try {
    const sql = fs.readFileSync('prisma/migrations/20260914235500_stage25_customer_portal/migration.sql', 'utf8');
    
    // Split statements safely
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement);
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('Notice: already exists, continuing...');
        } else {
          throw err;
        }
      }
    }

    const migrationName = '20260914235500_stage25_customer_portal';
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');

    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (gen_random_uuid()::text, '${checksum}', NOW(), '${migrationName}', NULL, NULL, NOW(), 1)
      ON CONFLICT DO NOTHING;
    `);

    console.log('Migration applied and recorded successfully!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

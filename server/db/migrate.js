require('dotenv').config();
const { initPostgres } = require('./postgres');

async function run() {
  try {
    console.log('🚀 Running PostgreSQL migration...');
    await initPostgres();
    console.log('✨ Database migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('💥 Migration failed:', err);
    process.exit(1);
  }
}

run();

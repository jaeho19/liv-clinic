const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:ac0997da@db.vkqeejqbyvcpxrqqshbu.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    const sqlPath = path.join(__dirname, '../supabase/migrations/20260131090500_phase_1_consultation.sql');
    console.log(`Reading migration file: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing migration...');
    const res = await client.query(sql);
    console.log('Migration completed successfully!');
    console.log(res);

    // Verification
    console.log('Verifying columns...');
    const result = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'consultation_requests'`);
    console.log('Columns:', result.rows.map(r => r.column_name));

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();

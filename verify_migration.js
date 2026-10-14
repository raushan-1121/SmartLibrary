
require('dotenv').config({ path: 'backend/.env' });

const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function verifyMigration() {
    try {

        const columns = await pool.query(`
  SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
  ORDER BY ordinal_position;
`);

        console.log('\n--- All Users Columns ---');
        console.table(columns.rows);

        const constraints = await pool.query(`
  SELECT conname, pg_get_constraintdef(oid, true) AS definition
  FROM pg_constraint
  WHERE conrelid = 'public.users'::regclass
  ORDER BY conname;
`);

        console.log('\n--- Users Constraints ---');
        console.table(constraints.rows);

    } catch (error) {
        console.error('Verification failed:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

verifyMigration();

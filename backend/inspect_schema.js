require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
});
(async () => {
  const r1 = await pool.query(
    "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
  );
  console.log('COLUMNS:', JSON.stringify(r1.rows, null, 2));
  const r2 = await pool.query(
    "SELECT con.conname, pg_get_constraintdef(con.oid) as def FROM pg_constraint con JOIN pg_class cl ON cl.oid = con.conrelid WHERE cl.relname = 'users'"
  );
  console.log('CONSTRAINTS:', JSON.stringify(r2.rows, null, 2));
  await pool.end();
})().catch(e => { console.error(e.message); pool.end(); });

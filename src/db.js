import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function query(sql) {
  const result = await pool.query(sql);
  return result.rows;
}

export default { query };

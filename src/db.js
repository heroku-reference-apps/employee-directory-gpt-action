import pg from 'pg'

const query = async (sql) => {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  const result = await pool.query(sql)
  return result.rows
}

export default {
  query
}

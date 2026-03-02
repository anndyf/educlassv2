const { Pool } = require('pg')
require('dotenv').config()

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })
  
  try {
    const res = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5')
    console.log('Last 5 audit logs:', JSON.stringify(res.rows, null, 2))
    
    const countRes = await pool.query('SELECT count(*) FROM audit_logs')
    console.log('Total audit logs:', countRes.rows[0].count)
  } catch (err) {
    console.error('Error querying DB:', err.message)
  } finally {
    await pool.end()
  }
}

main()

const { Pool } = require('pg')
require('dotenv').config()

async function listAll() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    console.log('Tables:', res.rows.map(r => r.table_name))
    
    if (res.rows.find(r => r.table_name === 'users')) {
      const users = await pool.query('SELECT id, email, name FROM users LIMIT 5')
      console.log('Users:', users.rows)
    }
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await pool.end()
  }
}

listAll()

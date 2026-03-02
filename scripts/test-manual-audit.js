const { Pool } = require('pg')
require('dotenv').config()

async function testManualAudit() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const userId = 'cml82hx140000rk43p6umfrvh' // Admin
    const id = 'test_' + Date.now()
    const query = 'INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())'
    const values = [id, userId, 'NOTA', 'test-entity', 'UPDATE', '{"test":true}']
    
    console.log('Inserting with values:', values)
    await pool.query(query, values)
    console.log('Manual insert successful')
    
    const check = await pool.query('SELECT * FROM audit_logs WHERE id = $1', [id])
    console.log('Checked record:', check.rows)
  } catch (e) {
    console.error('Manual insert failed:', e.message)
    console.error(e)
  } finally {
    await pool.end()
  }
}

testManualAudit()

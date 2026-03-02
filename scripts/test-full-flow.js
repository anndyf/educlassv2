const { v4: uuidv4 } = require('uuid')
const { Pool } = require('pg')
require('dotenv').config()

async function testFullAuditFlow() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const studentId = 'test-student'
    const discId = 'test-disc'
    const userId = 'cml82hx140000rk43p6umfrvh'
    
    console.log('--- Phase 1: Simulate Grade Launch ---')
    // Simulating lancar/route.ts logic
    const notaId = uuidv4()
    await pool.query(
      'INSERT INTO notas_finais (id, estudante_id, disciplina_id, nota_1, nota, status, modified_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [notaId, studentId, discId, 8, 8, 'APROVADO', userId]
    )
    console.log('Grade inserted:', notaId)
    
    console.log('--- Phase 2: Call logAudit logic (SQL Fallback Version) ---')
    const details = JSON.stringify({ nota1: 8, status: 'APROVADO' })
    const auditId = uuidv4()
    await pool.query(
      'INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [auditId, userId, 'NOTA', notaId, 'INSERT', details]
    )
    console.log('Audit log inserted:', auditId)
    
    console.log('--- Phase 3: Verify ---')
    const res = await pool.query('SELECT * FROM audit_logs WHERE id = $1', [auditId])
    console.log('Verification result length:', res.rows.length)
    if (res.rows.length > 0) {
      console.log('Details:', res.rows[0].details)
    }
    
    // Clean up
    await pool.query('DELETE FROM audit_logs WHERE id = $1', [auditId])
    await pool.query('DELETE FROM notas_finais WHERE id = $1', [notaId])
    console.log('Cleanup done')
    
  } catch (e) {
    console.error('Flow failed:', e)
  } finally {
    await pool.end()
  }
}

testFullAuditFlow()

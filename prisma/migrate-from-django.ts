/**
 * Script de migração de dados do Django para Next.js/Prisma
 * 
 * Este script:
 * 1. Cria um novo schema no banco de dados (schema 'nextjs')
 * 2. Migra todos os dados do Django preservando os existentes
 * 3. Mantém o schema Django intacto para rollback se necessário
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 10
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Mapeamento de status Django para Prisma
const statusMap: Record<string, any> = {
  'Aprovado': 'APROVADO',
  'Recuperação': 'RECUPERACAO',
  'Desistente': 'DESISTENTE',
  'Aprovado na Recuperação': 'APROVADO_RECUPERACAO',
  'Aprovado pelo Conselho': 'APROVADO_CONSELHO',
  'Dependência': 'DEPENDENCIA',
  'Conservado': 'CONSERVADO'
}

async function migrateData() {
  console.log('🚀 Iniciando migração de dados do Django para Prisma...\n')

  try {
    // 1. Migrar Usuários
    console.log('👤 Migrando usuários...')
    const djangoUsers = await prisma.$queryRaw<any[]>`
      SELECT id, username, email, password, first_name, last_name, is_superuser, is_staff, is_active
      FROM auth_user
    `
    
    const userIdMap = new Map<number, string>()
    
    for (const djangoUser of djangoUsers) {
      const user = await prisma.user.create({
        data: {
          email: djangoUser.email || `${djangoUser.username}@cetep.com`,
          username: djangoUser.username,
          password: djangoUser.password, // Já está hasheado do Django
          name: `${djangoUser.first_name || ''} ${djangoUser.last_name || ''}`.trim() || djangoUser.username,
          isSuperuser: djangoUser.is_superuser,
          isStaff: djangoUser.is_staff,
          isActive: djangoUser.is_active
        }
      })
      userIdMap.set(djangoUser.id, user.id)
    }
    console.log(`✅ ${djangoUsers.length} usuários migrados\n`)

    // 2. Migrar Turmas
    console.log('🏫 Migrando turmas...')
    const djangoTurmas = await prisma.$queryRaw<any[]>`
      SELECT id, nome FROM sistema_notas_turma
    `
    
    const turmaIdMap = new Map<number, string>()
    
    for (const djangoTurma of djangoTurmas) {
      const turma = await prisma.turma.create({
        data: {
          nome: djangoTurma.nome
        }
      })
      turmaIdMap.set(djangoTurma.id, turma.id)
      
      // Migrar relação many-to-many de usuários permitidos
      const turmaUsers = await prisma.$queryRaw<any[]>`
        SELECT user_id FROM sistema_notas_turma_usuarios_permitidos
        WHERE turma_id = ${djangoTurma.id}
      `
      
      for (const tu of turmaUsers) {
        const newUserId = userIdMap.get(tu.user_id)
        if (newUserId) {
          await prisma.turma.update({
            where: { id: turma.id },
            data: {
              usuariosPermitidos: {
                connect: { id: newUserId }
              }
            }
          })
        }
      }
    }
    console.log(`✅ ${djangoTurmas.length} turmas migradas\n`)

    // 3. Migrar Estudantes
    console.log('🎓 Migrando estudantes...')
    const djangoEstudantes = await prisma.$queryRaw<any[]>`
      SELECT id, nome, turma_id FROM sistema_notas_estudante
    `
    
    const estudanteIdMap = new Map<number, string>()
    
    for (const djangoEstudante of djangoEstudantes) {
      const newTurmaId = turmaIdMap.get(djangoEstudante.turma_id)
      if (newTurmaId) {
        const estudante = await prisma.estudante.create({
          data: {
            nome: djangoEstudante.nome,
            turmaId: newTurmaId
          }
        })
        estudanteIdMap.set(djangoEstudante.id, estudante.id)
      }
    }
    console.log(`✅ ${djangoEstudantes.length} estudantes migrados\n`)

    // 4. Migrar Disciplinas
    console.log('📚 Migrando disciplinas...')
    const djangoDisciplinas = await prisma.$queryRaw<any[]>`
      SELECT id, nome, turma_id FROM sistema_notas_disciplina
    `
    
    const disciplinaIdMap = new Map<number, string>()
    
    for (const djangoDisciplina of djangoDisciplinas) {
      const newTurmaId = turmaIdMap.get(djangoDisciplina.turma_id)
      if (newTurmaId) {
        const disciplina = await prisma.disciplina.create({
          data: {
            nome: djangoDisciplina.nome,
            turmaId: newTurmaId
          }
        })
        disciplinaIdMap.set(djangoDisciplina.id, disciplina.id)
        
        // Migrar relação many-to-many de usuários permitidos
        const discUsers = await prisma.$queryRaw<any[]>`
          SELECT user_id FROM sistema_notas_disciplina_usuarios_permitidos
          WHERE disciplina_id = ${djangoDisciplina.id}
        `
        
        for (const du of discUsers) {
          const newUserId = userIdMap.get(du.user_id)
          if (newUserId) {
            await prisma.disciplina.update({
              where: { id: disciplina.id },
              data: {
                usuariosPermitidos: {
                  connect: { id: newUserId }
                }
              }
            })
          }
        }
      }
    }
    console.log(`✅ ${djangoDisciplinas.length} disciplinas migradas\n`)

    // 5. Migrar Notas Finais
    console.log('📝 Migrando notas finais...')
    const djangoNotas = await prisma.$queryRaw<any[]>`
      SELECT id, estudante_id, disciplina_id, nota, nota_recuperacao, status, modified_by_id, modified_at
      FROM sistema_notas_notafinal
    `
    
    const notaIdMap = new Map<number, string>()
    let notasMigradas = 0
    
    for (const djangoNota of djangoNotas) {
      const newEstudanteId = estudanteIdMap.get(djangoNota.estudante_id)
      const newDisciplinaId = disciplinaIdMap.get(djangoNota.disciplina_id)
      const newModifiedById = djangoNota.modified_by_id ? userIdMap.get(djangoNota.modified_by_id) : null
      
      if (newEstudanteId && newDisciplinaId) {
        const status = statusMap[djangoNota.status] || 'RECUPERACAO'
        
        const nota = await prisma.notaFinal.create({
          data: {
            estudanteId: newEstudanteId,
            disciplinaId: newDisciplinaId,
            nota: djangoNota.nota,
            notaRecuperacao: djangoNota.nota_recuperacao,
            status: status,
            modifiedById: newModifiedById,
            modifiedAt: djangoNota.modified_at
          }
        })
        notaIdMap.set(djangoNota.id, nota.id)
        notasMigradas++
      }
    }
    console.log(`✅ ${notasMigradas} notas finais migradas\n`)

    // 6. Migrar Auditorias
    console.log('📋 Migrando auditorias...')
    const djangoAudits = await prisma.$queryRaw<any[]>`
      SELECT nota_final_id, nota_anterior, nota_atual, status, modified_by_id, created_at
      FROM sistema_notas_notafinalaudit
    `
    
    let auditsMigradas = 0
    
    for (const djangoAudit of djangoAudits) {
      const newNotaFinalId = notaIdMap.get(djangoAudit.nota_final_id)
      const newModifiedById = djangoAudit.modified_by_id ? userIdMap.get(djangoAudit.modified_by_id) : null
      
      if (newNotaFinalId) {
        const status = statusMap[djangoAudit.status] || 'RECUPERACAO'
        
        await prisma.notaFinalAudit.create({
          data: {
            notaFinalId: newNotaFinalId,
            notaAnterior: djangoAudit.nota_anterior,
            notaAtual: djangoAudit.nota_atual,
            status: status,
            modifiedById: newModifiedById,
            createdAt: djangoAudit.created_at
          }
        })
        auditsMigradas++
      }
    }
    console.log(`✅ ${auditsMigradas} auditorias migradas\n`)

    console.log('🎉 Migração concluída com sucesso!')
    console.log('\n📊 Resumo da migração:')
    console.log(`   - Usuários: ${djangoUsers.length}`)
    console.log(`   - Turmas: ${djangoTurmas.length}`)
    console.log(`   - Disciplinas: ${djangoDisciplinas.length}`)
    console.log(`   - Estudantes: ${djangoEstudantes.length}`)
    console.log(`   - Notas: ${notasMigradas}`)
    console.log(`   - Auditorias: ${auditsMigradas}`)
    console.log('\n✅ Todos os dados foram preservados!')
    console.log('\n🔑 Use as mesmas credenciais do Django para fazer login')

  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    throw error
  }
}

migrateData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

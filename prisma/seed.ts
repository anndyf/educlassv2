import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Iniciando migração de dados do Django para Prisma...\n')

  try {
    // Limpar dados existentes (cuidado em produção!)
    console.log('🗑️  Limpando dados existentes...')
    await prisma.notaFinalAudit.deleteMany()
    await prisma.notaFinal.deleteMany()
    await prisma.estudante.deleteMany()
    await prisma.disciplina.deleteMany()
    await prisma.turma.deleteMany()
    await prisma.user.deleteMany()
    console.log('✅ Dados limpos\n')

    // Criar usuário admin
    console.log('👤 Criando usuário admin...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cetep.com',
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador',
        isSuperuser: true,
        isStaff: true,
        isActive: true
      }
    })
    console.log(`✅ Admin criado: ${admin.username}\n`)

    // Criar turmas de exemplo
    console.log('🏫 Criando turmas...')
    const turma1 = await prisma.turma.create({
      data: {
        nome: '1º TIM - Técnico em Informática - Matutino',
        usuariosPermitidos: {
          connect: { id: admin.id }
        }
      }
    })

    const turma2 = await prisma.turma.create({
      data: {
        nome: '2º TIM - Técnico em Informática - Noturno',
        usuariosPermitidos: {
          connect: { id: admin.id }
        }
      }
    })
    console.log(`✅ Turmas criadas: ${turma1.nome}, ${turma2.nome}\n`)

    // Criar disciplinas
    console.log('📚 Criando disciplinas...')
    const disciplinas = await Promise.all([
      prisma.disciplina.create({
        data: {
          nome: 'Programação Web',
          turmaId: turma1.id,
          usuariosPermitidos: {
            connect: { id: admin.id }
          }
        }
      }),
      prisma.disciplina.create({
        data: {
          nome: 'Banco de Dados',
          turmaId: turma1.id,
          usuariosPermitidos: {
            connect: { id: admin.id }
          }
        }
      }),
      prisma.disciplina.create({
        data: {
          nome: 'Redes de Computadores',
          turmaId: turma2.id,
          usuariosPermitidos: {
            connect: { id: admin.id }
          }
        }
      })
    ])
    console.log(`✅ ${disciplinas.length} disciplinas criadas\n`)

    // Criar estudantes
    console.log('🎓 Criando estudantes...')
    const estudantes = await Promise.all([
      prisma.estudante.create({
        data: {
          nome: 'João Silva',
          turmaId: turma1.id
        }
      }),
      prisma.estudante.create({
        data: {
          nome: 'Maria Santos',
          turmaId: turma1.id
        }
      }),
      prisma.estudante.create({
        data: {
          nome: 'Pedro Oliveira',
          turmaId: turma2.id
        }
      }),
      prisma.estudante.create({
        data: {
          nome: 'Ana Costa',
          turmaId: turma2.id
        }
      })
    ])
    console.log(`✅ ${estudantes.length} estudantes criados\n`)

    // Criar notas de exemplo
    console.log('📝 Criando notas...')
    await prisma.notaFinal.create({
      data: {
        estudanteId: estudantes[0].id,
        disciplinaId: disciplinas[0].id,
        nota: 8.5,
        status: 'APROVADO',
        modifiedById: admin.id
      }
    })

    await prisma.notaFinal.create({
      data: {
        estudanteId: estudantes[1].id,
        disciplinaId: disciplinas[0].id,
        nota: 4.0,
        status: 'RECUPERACAO',
        modifiedById: admin.id
      }
    })
    console.log('✅ Notas criadas\n')

    console.log('🎉 Migração concluída com sucesso!')
    console.log('\n📊 Resumo:')
    console.log(`   - Usuários: 1`)
    console.log(`   - Turmas: 2`)
    console.log(`   - Disciplinas: ${disciplinas.length}`)
    console.log(`   - Estudantes: ${estudantes.length}`)
    console.log(`   - Notas: 2`)
    console.log('\n🔑 Credenciais de acesso:')
    console.log('   Username: admin')
    console.log('   Password: admin123')

  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

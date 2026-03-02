
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

// Sanitize DB URL
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
  dbUrl = dbUrl.substring(1, dbUrl.length - 1);
}

const pool = new Pool({
  connectionString: dbUrl!
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('📝 Iniciando preenchimento de notas nos estudantes existentes...')

  try {
    // 1. Buscar o admin (para marcar quem modificou a nota)
    const admin = await prisma.user.findFirst({
      where: { OR: [{ isSuperuser: true }, { username: 'admin' }] }
    })

    if (!admin) {
      console.error('❌ Erro: Nenhum usuário administrador encontrado. Crie um admin primeiro.')
      return
    }

    // 2. Buscar todos os estudantes com suas turmas e disciplinas da turma
    const estudantes = await prisma.estudante.findMany({
      include: {
        turma: {
          include: {
            disciplinas: true
          }
        }
      }
    })

    if (estudantes.length === 0) {
      console.log('⚠️ Nenhum estudante encontrado no banco de dados.')
      return
    }

    console.log(`🔍 Processando ${estudantes.length} estudantes...`)

    let notasCriadas = 0
    let notasPuladas = 0

    for (const estudante of estudantes) {
      const disciplinas = estudante.turma?.disciplinas || []
      
      if (disciplinas.length === 0) {
        console.log(`🔸 Estudante ${estudante.nome} está em uma turma sem disciplinas.`)
        continue
      }

      for (const disciplina of disciplinas) {
        // Verificar se já existe nota para este estudante nesta disciplina
        const notaExistente = await prisma.notaFinal.findUnique({
          where: {
            estudanteId_disciplinaId: {
              estudanteId: estudante.matricula,
              disciplinaId: disciplina.id
            }
          }
        })

        if (notaExistente) {
          notasPuladas++
          continue
        }

        // Gerar uma nota aleatória mesclada (Aprovado ou Recuperação)
        // Usamos a matrícula ou index para manter consistente mas variado
        const seed = parseInt(estudante.matricula.slice(-1)) || 0
        const isApproved = seed % 2 === 0
        const valorNota = isApproved ? (7.5 + (seed / 5)) : (3.5 + (seed / 4))
        const status = isApproved ? 'APROVADO' : 'RECUPERACAO'

        await prisma.notaFinal.create({
          data: {
            estudanteId: estudante.matricula,
            disciplinaId: disciplina.id,
            nota: parseFloat(valorNota.toFixed(1)),
            status: status as any,
            modifiedById: admin.id,
            // Preencher notas parciais também para o dashboard ficar bonito
            nota1: parseFloat((valorNota * 0.8).toFixed(1)),
            nota2: parseFloat((valorNota * 0.9).toFixed(1)),
            nota3: valorNota
          }
        })
        notasCriadas++
      }
    }

    console.log('\n✨ Processo de lançamento concluído!')
    console.log(`✅ Notas novas criadas: ${notasCriadas}`)
    console.log(`ℹ️ Notas já existentes (mantidas): ${notasPuladas}`)

  } catch (error) {
    console.error('❌ Erro ao lançar notas:', error)
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

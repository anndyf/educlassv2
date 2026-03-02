
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('--- DEBUGGING ANO LETIVO ---')
  
  const config = await prisma.globalConfig.findUnique({ where: { id: 'global' } })
  console.log('Global Config:', config)

  const systemDateYear = new Date().getFullYear()
  console.log('System Date Year:', systemDateYear)

  const countTurmasTotal = await prisma.turma.count()
  console.log('Total Turmas in DB:', countTurmasTotal)

  const countTurmas2025 = await prisma.turma.count({ where: { anoLetivo: 2025 } })
  console.log('Turmas with anoLetivo = 2025:', countTurmas2025)

  const countTurmas2026 = await prisma.turma.count({ where: { anoLetivo: 2026 } })
  console.log('Turmas with anoLetivo = 2026:', countTurmas2026)

  const countTurmasNull = await prisma.turma.count({ where: { anoLetivo: null } })
  console.log('Turmas with anoLetivo = null:', countTurmasNull)

  // Listar algumas turmas para ver como estão
  const turmas = await prisma.turma.findMany({ take: 5 })
  console.log('Sample Turmas:', turmas.map(t => ({ id: t.id, nome: t.nome, anoLetivo: t.anoLetivo })))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  })

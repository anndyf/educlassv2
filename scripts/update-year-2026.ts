
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('--- ATUALIZANDO ANO LETIVO PARA 2026 ---')
  
  // 1. Atualizar Configuração Global
  const config = await prisma.globalConfig.upsert({
    where: { id: 'global' },
    update: {
      anoLetivoAtual: 2026
    },
    create: {
      id: 'global',
      anoLetivoAtual: 2026
    }
  })
  
  console.log(`Global Config atualizada para: ${config.anoLetivoAtual}`)

  // 2. Migrar turmas de 2025 para 2026
  // Isso garante que os dados que "apareceram" quando setamos 2025 continuem visíveis em 2026
  const updateResult = await prisma.turma.updateMany({
    where: {
      anoLetivo: 2025
    },
    data: {
      anoLetivo: 2026
    }
  })

  console.log(`Turmas migradas de 2025 para 2026: ${updateResult.count}`)

  // 3. Verificação final
  const count2026 = await prisma.turma.count({ where: { anoLetivo: 2026 } })
  console.log(`Total de turmas agora em 2026: ${count2026}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    process.exit(0)
  })

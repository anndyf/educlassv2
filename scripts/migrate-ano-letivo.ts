
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Iniciando migração de ano letivo...')
  
  // Atualizar Configuração Global
  const config = await prisma.globalConfig.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      anoLetivoAtual: 2025
    }
  })
  
  console.log(`Ano letivo atual configurado para: ${config.anoLetivoAtual}`)

  // Atualizar Turmas sem ano
  const updateResult = await prisma.turma.updateMany({
    where: {
      anoLetivo: null
    },
    data: {
      anoLetivo: 2025
    }
  })

  console.log(`Turmas atualizadas: ${updateResult.count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // disconnecting logic if needed, but imported prisma instance handles it usually or stays open.
    // However, since it's a script, we should exit.
    process.exit(0)
  })

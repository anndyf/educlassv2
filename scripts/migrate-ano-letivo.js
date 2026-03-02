const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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
    await prisma.$disconnect()
  })

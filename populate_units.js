
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Distribuindo notas finais para as unidades (apenas onde unidades são nulas)...')

  const notas = await prisma.notaFinal.findMany({
    where: {
      AND: [
        { nota: { not: null } },
        { nota1: null },
        { nota2: null },
        { nota3: null }
      ]
    }
  })

  console.log(`🔍 Encontradas ${notas.length} notas para atualizar.`)

  for (const n of notas) {
    // Replica a nota final para as 3 unidades para fins de visualização
    await prisma.notaFinal.update({
      where: { id: n.id },
      data: {
        nota1: n.nota,
        nota2: n.nota,
        nota3: n.nota,
        // Mantemos isDesistenteUnid false pois assumimos que se tem nota final, cursou
      }
    })
  }

  console.log('✅ Notas atualizadas com sucesso!')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())

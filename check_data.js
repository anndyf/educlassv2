
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const notas = await prisma.notaFinal.findMany({
      take: 5,
      select: {
        id: true,
        nota: true,
        nota1: true,
        nota2: true,
        nota3: true
      }
    })
    console.log(JSON.stringify(notas, null, 2))
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()

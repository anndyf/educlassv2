const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debug() {
  try {
    console.log('Testing query...')
    const provas = await prisma.prova.findMany({
      include: {
        turma: { select: { nome: true } },
        professorCriador: { select: { name: true } },
        savedByUser: { select: { name: true } },
        questoes: { select: { id: true } }
      }
    })
    console.log('Success! Found', provas.length, 'provas')
  } catch (error) {
    console.error('CRITICAL QUERY ERROR:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debug()

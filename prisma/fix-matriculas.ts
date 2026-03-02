
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando correção de matrículas...')
  const students = await prisma.estudante.findMany({
    where: {
      matricula: ''
    }
  })

  console.log(`Encontrados ${students.length} estudantes sem matrícula.`)

  for (let i = 0; i < students.length; i++) {
    const matricula = `TMP${Date.now().toString().slice(-6)}${i.toString().padStart(3, '0')}`
    await prisma.estudante.update({
      where: { matricula: students[i].matricula },
      data: { matricula }
    })
    console.log(`Estudante ${students[i].nome} atualizado com matrícula: ${matricula}`)
  }

  console.log('Correção concluída.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

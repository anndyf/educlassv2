
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching only Turma...')
  const turma = await prisma.turma.findFirst()
  if (!turma) {
    console.log('No turma found')
    return
  }
  console.log('Turma:', turma.nome, turma.id)

  console.log('Fetching Students...')
  const students = await prisma.estudante.findMany({
    where: { turmaId: turma.id },
    take: 1
  })

  if (students.length === 0) {
    console.log('No students in this turma')
    return
  }

  const student = students[0]
  console.log('Student:', student.nome, student.id)

  console.log('Fetching Notas for student...')
  const notas = await prisma.notaFinal.findMany({
    where: { estudanteId: student.id }
  })
  
  console.log('Notas found:', notas.length)
  console.log(JSON.stringify(notas, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

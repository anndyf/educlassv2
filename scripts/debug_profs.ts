
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const matricula = "10661222"
  const estudante = await prisma.estudante.findUnique({
    where: { matricula },
    include: {
      turma: {
        include: {
          disciplinas: {
            include: {
              usuariosPermitidos: true
            }
          }
        }
      }
    }
  })

  if (!estudante) {
    console.log("Estudante não encontrado")
    return
  }

  console.log(`Estudante: ${estudante.nome}`)
  console.log(`Turma: ${estudante.turma.nome}`)
  console.log("Disciplinas e Professores:")
  estudante.turma.disciplinas.forEach(d => {
    const profs = d.usuariosPermitidos.map(u => u.name || u.username).join(", ")
    console.log(`- ${d.nome}: [${profs || "NENHUM PROFESSOR"}]`)
  })

  await prisma.$disconnect()
}

main()

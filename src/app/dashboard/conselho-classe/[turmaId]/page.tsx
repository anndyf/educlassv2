import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ConselhoClasseClient from "./ConselhoClasseClient"

export const runtime = 'nodejs'

async function getNotasConselho(turmaId: string) {
  const turma = await prisma.turma.findUnique({
    where: { id: turmaId },
    include: {
      estudantes: {
        include: {
          notas: {
          where: {
            OR: [
              {
                status: 'RECUPERACAO',
                notaRecuperacao: { lt: 5 }
              },
              {
                status: { in: ['APROVADO_CONSELHO', 'DEPENDENCIA', 'CONSERVADO', 'APROVADO_RECUPERACAO'] }
              }
            ]
          },
            include: {
              disciplina: true
            }
          }
        }
      }
    }
  })

  if (!turma) return null

  // Flatten notas
  const notasConselho = turma.estudantes.flatMap(estudante =>
    estudante.notas.map(nota => ({
      id: nota.id,
      nota: nota.nota,
      nota1: nota.nota1,
      nota2: nota.nota2,
      nota3: nota.nota3,
      notaRecuperacao: nota.notaRecuperacao,
      status: nota.status,
      estudanteId: estudante.id,
      estudanteNome: estudante.nome,
      disciplinaId: nota.disciplinaId,
      disciplinaNome: nota.disciplina.nome
    }))
  )

  return {
    turma,
    notasConselho
  }
}

export default async function ConselhoClasseTurmaPage({
  params
}: {
  params: Promise<{ turmaId: string }>
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { turmaId } = await params
  const data = await getNotasConselho(turmaId)

  if (!data) {
    redirect("/dashboard/conselho-classe")
  }

  return (
    <ConselhoClasseClient
      turmaId={data.turma.id}
      turmaNome={data.turma.nome}
      turmaCurso={data.turma.curso}
      turmaTurno={data.turma.turno}
      notasConselho={data.notasConselho}
    />
  )
}


"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getSchedule(turmaId: string) {
  const session = await auth()
  if (!session) return { error: "Sem permissão" }

  try {
    const horarios = await prisma.horarioAula.findMany({
      where: { turmaId },
      orderBy: [
        { diaSemana: 'asc' },
        { horario: 'asc' }
      ]
    })
    return { horarios }
  } catch (error) {
    console.error("Erro ao buscar horários", error)
    return { error: "Erro ao buscar horários" }
  }
}

export type ScheduleItem = {
    diaSemana: number
    horario: number
    disciplina: string
    professor: string
}

export async function saveSchedule(turmaId: string, items: ScheduleItem[]) {
  const session = await auth()
  if (!session || (!session.user.isSuperuser && !session.user.isDirecao)) {
    return { error: "Sem permissão" }
  }

  try {
    // Transaction to update all
    await prisma.$transaction(async (tx: any) => {
      // Delete existing for this turma
      await tx.horarioAula.deleteMany({
        where: { turmaId }
      })

      // Create new ones
      if (items.length > 0) {
        await tx.horarioAula.createMany({
            data: items.map(i => ({
                turmaId,
                diaSemana: i.diaSemana,
                horario: i.horario,
                disciplina: i.disciplina,
                professor: i.professor
            }))
        })
      }
    })

    revalidatePath(`/dashboard/turmas/${turmaId}/horario`)
    return { success: true }
  } catch (error) {
    console.error("Erro ao salvar horário", error)
    return { error: "Erro ao salvar horário" }
  }
}

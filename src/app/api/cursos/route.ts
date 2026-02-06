import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

  const cursos = await prisma.curso.findMany({
    orderBy: { nome: 'asc' }
  })
  return NextResponse.json(cursos)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || !session.user.isSuperuser) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { nome, sigla, modalidade, turnos } = await request.json()

    if (!nome || !sigla || !modalidade || !turnos || turnos.length === 0) {
      return NextResponse.json({ message: 'Preencha todos os campos obrigatórios' }, { status: 400 })
    }

    const curso = await prisma.curso.create({
      data: {
        nome: nome.trim(),
        sigla: sigla.trim().toUpperCase(),
        modalidade,
        turnos
      }
    })

    return NextResponse.json(curso, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Já existe um curso com este nome ou sigla' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Erro ao criar curso' }, { status: 500 })
  }
}

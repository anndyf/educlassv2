import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// POST create estudante
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { nome, turmaId } = await request.json()

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { message: 'Nome do estudante é obrigatório' },
        { status: 400 }
      )
    }

    if (!turmaId) {
      return NextResponse.json(
        { message: 'Turma é obrigatória' },
        { status: 400 }
      )
    }

    const estudante = await prisma.estudante.create({
      data: {
        nome: nome.trim(),
        turmaId
      }
    })

    return NextResponse.json(estudante, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar estudante:', error)
    return NextResponse.json(
      { message: 'Erro ao criar estudante' },
      { status: 500 }
    )
  }
}

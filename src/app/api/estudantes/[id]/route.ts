import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// PUT update estudante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const estudante = await prisma.estudante.update({
      where: { id: params.id },
      data: {
        nome: nome.trim(),
        turmaId
      }
    })

    return NextResponse.json(estudante)
  } catch (error) {
    console.error('Erro ao atualizar estudante:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar estudante' },
      { status: 500 }
    )
  }
}

// DELETE estudante
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se há notas vinculadas
    const estudante = await prisma.estudante.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            notas: true
          }
        }
      }
    })

    if (!estudante) {
      return NextResponse.json({ message: 'Estudante não encontrado' }, { status: 404 })
    }

    if (estudante._count.notas > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir um estudante com notas lançadas' },
        { status: 400 }
      )
    }

    await prisma.estudante.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Estudante excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir estudante:', error)
    return NextResponse.json(
      { message: 'Erro ao excluir estudante' },
      { status: 500 }
    )
  }
}

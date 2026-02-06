import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatusNota } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { notas } = await request.json()

    if (!Array.isArray(notas) || notas.length === 0) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 })
    }

    // Processar cada nota de recuperação
    const results = await Promise.all(
      notas.map(async ({ notaId, notaRecuperacao }) => {
        // Validação de range (0-10)
        if (notaRecuperacao < 0 || notaRecuperacao > 10) {
          throw new Error(`Nota de recuperação inválida: deve estar entre 0 e 10`)
        }

        // Buscar nota original
        const notaOriginal = await prisma.notaFinal.findUnique({
          where: { id: notaId }
        })

        if (!notaOriginal) {
          throw new Error(`Nota ${notaId} não encontrada`)
        }

        // Lógica do Python: Apenas verifica se a nota da recuperação é >= 5
        // Não calcula média, e não altera a nota original.
        
        let novoStatus: StatusNota = 'RECUPERACAO'
        
        if (notaRecuperacao >= 5) {
          novoStatus = 'APROVADO_RECUPERACAO'
        } else {
          novoStatus = 'RECUPERACAO'
        }

        // Criar auditoria
        await prisma.notaFinalAudit.create({
          data: {
            notaFinalId: notaOriginal.id,
            notaAnterior: notaOriginal.nota,
            notaAtual: notaOriginal.nota, // Nota original não muda
            status: novoStatus,
            modifiedById: session.user.id
          }
        })

        // Atualizar nota com recuperação (apenas notaRecuperacao e Status)
        return await prisma.notaFinal.update({
          where: { id: notaId },
          data: {
            notaRecuperacao,
            status: novoStatus,
            modifiedById: session.user.id,
            modifiedAt: new Date()
          }
        })
      })
    )

    return NextResponse.json({
      message: 'Notas de recuperação lançadas com sucesso',
      count: results.length
    })
  } catch (error: any) {
    console.error('Erro ao lançar recuperação:', error)
    
    // Mensagens mais específicas para erros de validação
    if (error.message.includes('deve estar entre 0 e 10')) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    if (error.message.includes('não encontrada')) {
      return NextResponse.json({ message: error.message }, { status: 404 })
    }
    
    return NextResponse.json(
      { message: 'Erro ao lançar recuperação' },
      { status: 500 }
    )
  }
}

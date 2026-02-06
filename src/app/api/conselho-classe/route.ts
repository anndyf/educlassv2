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

    const { decisoes } = await request.json()

    if (!Array.isArray(decisoes) || decisoes.length === 0) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 })
    }

    // Processar cada decisão do conselho
    const results = await Promise.all(
      decisoes.map(async ({ notaId, novoStatus, novaNotaRec }: { notaId: string, novoStatus: string, novaNotaRec?: number | null }) => {
        // Validação de range para nota de recuperação (se fornecida)
        if (novaNotaRec !== undefined && novaNotaRec !== null && (novaNotaRec < 0 || novaNotaRec > 10)) {
          throw new Error(`Nota de recuperação inválida: deve estar entre 0 e 10`)
        }

        const status = novoStatus as StatusNota
        // Buscar nota original
        const notaOriginal = await prisma.notaFinal.findUnique({
          where: { id: notaId }
        })

        if (!notaOriginal) {
          throw new Error(`Nota ${notaId} não encontrada`)
        }

        // Criar auditoria
        await prisma.notaFinalAudit.create({
          data: {
            notaFinalId: notaOriginal.id,
            notaAnterior: notaOriginal.nota,
            notaAtual: notaOriginal.nota, // Mantém a nota original
            status: status,
            modifiedById: session.user.id
          }
        })

        // Atualizar status e nota de recuperação se fornecida
        return await prisma.notaFinal.update({
          where: { id: notaId },
          data: {
            status: status,
            notaRecuperacao: novaNotaRec !== undefined ? novaNotaRec : notaOriginal.notaRecuperacao,
            modifiedById: session.user.id,
            modifiedAt: new Date()
          }
        })
      })
    )

    return NextResponse.json({
      message: 'Decisões do conselho salvas com sucesso',
      count: results.length
    })
  } catch (error: any) {
    console.error('Erro ao salvar conselho:', error)
    
    // Mensagens mais específicas para erros de validação
    if (error.message.includes('deve estar entre 0 e 10')) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    if (error.message.includes('não encontrada')) {
      return NextResponse.json({ message: error.message }, { status: 404 })
    }
    
    return NextResponse.json(
      { message: 'Erro ao salvar decisões do conselho' },
      { status: 500 }
    )
  }
}

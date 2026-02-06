
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

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

    // Processar cada nota
    const results = await Promise.all(
      notas.map(async ({ estudanteId, disciplinaId, nota1, nota2, nota3, isDesistente, isDesistenteUnid1, isDesistenteUnid2, isDesistenteUnid3 }) => {
        // Se todos os campos estiverem vazios e não for desistente, ignorar
        const isAllEmpty = (nota1 === '' || nota1 === null) && 
                          (nota2 === '' || nota2 === null) && 
                          (nota3 === '' || nota3 === null) && 
                          !isDesistente && !isDesistenteUnid1 && !isDesistenteUnid2 && !isDesistenteUnid3;

        if (isAllEmpty) {
          return { skipped: true, estudanteId };
        }

        const n1 = (nota1 !== undefined && nota1 !== null && nota1 !== '') ? parseFloat(String(nota1).replace(',', '.')) : null
        const n2 = (nota2 !== undefined && nota2 !== null && nota2 !== '') ? parseFloat(String(nota2).replace(',', '.')) : null
        const n3 = (nota3 !== undefined && nota3 !== null && nota3 !== '') ? parseFloat(String(nota3).replace(',', '.')) : null

        // Validação de range (0-10)
        if (n1 !== null && (n1 < 0 || n1 > 10)) {
          throw new Error(`Nota 1 inválida para estudante ${estudanteId}: deve estar entre 0 e 10`)
        }
        if (n2 !== null && (n2 < 0 || n2 > 10)) {
          throw new Error(`Nota 2 inválida para estudante ${estudanteId}: deve estar entre 0 e 10`)
        }
        if (n3 !== null && (n3 < 0 || n3 > 10)) {
          throw new Error(`Nota 3 inválida para estudante ${estudanteId}: deve estar entre 0 e 10`)
        }

        const val1 = (isDesistenteUnid1 || isDesistente) ? 0 : (n1 !== null ? n1 : 0)
        const val2 = (isDesistenteUnid2 || isDesistente) ? 0 : (n2 !== null ? n2 : 0)
        const val3 = (isDesistenteUnid3 || isDesistente) ? 0 : (n3 !== null ? n3 : 0)

        let notaCalculada = (val1 + val2 + val3) / 3
        notaCalculada = Math.round(notaCalculada * 10) / 10

        let status = 'RECUPERACAO'
        if (isDesistente) {
          status = 'DESISTENTE'
          notaCalculada = -1
        } else if (notaCalculada >= 5) {
          status = 'APROVADO'
        }

        const statusEnum = status as any
        
        const existing = await prisma.$queryRaw<any[]>`
          SELECT id FROM "notas_finais" 
          WHERE "estudante_id" = ${estudanteId} AND "disciplina_id" = ${disciplinaId}
          LIMIT 1
        `

        if (existing.length > 0) {
          const notaId = existing[0].id
          await prisma.$executeRaw`
            UPDATE "notas_finais"
            SET 
              "nota_1" = ${n1},
              "nota_2" = ${n2},
              "nota_3" = ${n3},
              "nota" = ${notaCalculada},
              "status" = ${statusEnum}::"status_nota",
              "is_desistente_unid1" = ${!!isDesistenteUnid1},
              "is_desistente_unid2" = ${!!isDesistenteUnid2},
              "is_desistente_unid3" = ${!!isDesistenteUnid3},
              "modified_by_id" = ${session.user.id},
              "updated_at" = NOW(),
              "modified_at" = NOW()
            WHERE "id" = ${notaId}
          `
          return { id: notaId, updated: true }
        } else {
          const newId = uuidv4()
          await prisma.$executeRaw`
            INSERT INTO "notas_finais" (
              "id", "estudante_id", "disciplina_id", "nota_1", "nota_2", "nota_3", "nota", "status", 
              "is_desistente_unid1", "is_desistente_unid2", "is_desistente_unid3",
              "modified_by_id", "created_at", "updated_at", "modified_at"
            )
            VALUES (
              ${newId}, ${estudanteId}, ${disciplinaId}, ${n1}, ${n2}, ${n3}, ${notaCalculada}, ${statusEnum}::"status_nota", 
              ${!!isDesistenteUnid1}, ${!!isDesistenteUnid2}, ${!!isDesistenteUnid3},
              ${session.user.id}, NOW(), NOW(), NOW()
            )
          `
          return { id: newId, created: true }
        }
      })
    )

    return NextResponse.json({ message: 'Processamento concluído', count: results.length })
  } catch (error: any) {
    console.error('Erro crítico ao lançar notas:', error.message)
    
    // Mensagens mais específicas para erros de validação
    if (error.message.includes('deve estar entre 0 e 10')) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Erro ao processar notas' }, { status: 500 })
  }
}

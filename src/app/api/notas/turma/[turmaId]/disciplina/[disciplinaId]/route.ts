
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ turmaId: string; disciplinaId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { turmaId, disciplinaId } = await params

    console.log(`Buscando notas via Raw SQL para Turma: ${turmaId}, Disc: ${disciplinaId}`)

    const notas = await prisma.$queryRaw<any[]>`
      SELECT 
        nf.id,
        nf."estudante_id" as "estudanteId",
        nf."disciplina_id" as "disciplinaId",
        nf."nota_1" as "nota1",
        nf."nota_2" as "nota2",
        nf."nota_3" as "nota3",
        nf.nota,
        nf.status,
        nf."is_desistente_unid1" as "isDesistenteUnid1",
        nf."is_desistente_unid2" as "isDesistenteUnid2",
        nf."is_desistente_unid3" as "isDesistenteUnid3"
      FROM "notas_finais" nf
      INNER JOIN "estudantes" e ON e.id = nf."estudante_id"
      WHERE nf."disciplina_id" = ${disciplinaId} AND e."turma_id" = ${turmaId}
    `

    return NextResponse.json(notas)
  } catch (error) {
    console.error('Erro ao buscar notas via SQL:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar notas' },
      { status: 500 }
    )
  }
}

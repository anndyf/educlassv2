import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Ler conteúdo do arquivo
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length <= 1) {
      return NextResponse.json({ message: 'Arquivo CSV vazio' }, { status: 400 })
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []

    // Processar cada linha (pulando o cabeçalho)
    for (let i = 1; i < lines.length; i++) {
      try {
        const [nome, turmaNome] = lines[i].split(',').map(s => s.trim())
        
        if (!nome || !turmaNome) {
          errors.push(`Linha ${i + 1}: Dados incompletos`)
          continue
        }

        // Buscar ou criar turma
        let turma = await prisma.turma.findFirst({
          where: { nome: turmaNome }
        })

        if (!turma) {
          turma = await prisma.turma.create({
            data: { nome: turmaNome }
          })
        }

        // Verificar se estudante já existe
        const estudanteExiste = await prisma.estudante.findFirst({
          where: {
            nome,
            turmaId: turma.id
          }
        })

        if (estudanteExiste) {
          skipped++
          continue
        }

        // Criar estudante
        await prisma.estudante.create({
          data: {
            nome,
            turmaId: turma.id
          }
        })

        created++
      } catch (error) {
        errors.push(`Linha ${i + 1}: ${error}`)
      }
    }

    return NextResponse.json({
      message: 'Importação concluída',
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Erro ao processar CSV:', error)
    return NextResponse.json(
      { message: 'Erro ao processar arquivo CSV' },
      { status: 500 }
    )
  }
}

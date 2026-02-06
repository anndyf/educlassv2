import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const runtime = 'nodejs'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

function getStatusAbbr(status: string) {
  const map: Record<string, string> = {
    'APROVADO': 'AP',
    'RECUPERACAO': 'RC',
    'DESISTENTE': 'DS',
    'APROVADO_RECUPERACAO': 'AR',
    'APROVADO_CONSELHO': 'AC',
    'DEPENDENCIA': 'DP',
    'CONSERVADO': 'CO'
  }
  return map[status] || '-'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const turma = await prisma.turma.findUnique({
      where: { id },
      include: {
        disciplinas: {
          orderBy: { nome: 'asc' }
        },
        estudantes: {
          include: {
            notas: {
              include: {
                disciplina: true
              }
            }
          },
          orderBy: { nome: 'asc' }
        }
      }
    })

    if (!turma) {
      return NextResponse.json({ message: 'Turma não encontrada' }, { status: 404 })
    }

    // Criar PDF em formato paisagem
    const doc = new jsPDF('landscape')

    // Cabeçalho
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('RELATÓRIO DE STATUS POR DISCIPLINA', 148, 15, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('EduClass - CETEP/LNAB', 148, 22, { align: 'center' })

    // Informações da Turma
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Turma:', 20, 32)
    doc.setFont('helvetica', 'normal')
    doc.text(turma.nome, 45, 32)

    // Legenda
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Legenda:', 20, 40)
    doc.setFont('helvetica', 'normal')
    doc.text('AP=Aprovado | RC=Recuperação | AR=Aprov.Recup. | AC=Aprov.Conselho | DP=Dependência | DS=Desistente | CO=Conservado', 45, 40)

    // Preparar dados da tabela
    const headers = ['#', 'Estudante', ...turma.disciplinas.map(d => d.nome)]
    
    const tableData = turma.estudantes.map((estudante, index) => {
      const notasMap = new Map(
        estudante.notas.map(n => [n.disciplinaId, n])
      )

      const row = [
        (index + 1).toString(),
        estudante.nome,
        ...turma.disciplinas.map(disc => {
          const nota = notasMap.get(disc.id)
          return nota ? getStatusAbbr(nota.status) : '-'
        })
      ]

      return row
    })

    // Criar tabela
    autoTable(doc, {
      startY: 48,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8,
        minCellHeight: 40
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 50 }
      },
      didParseCell: function(data: any) {
        // Centralizar cabeçalho "Estudante"
        if (data.section === 'head' && data.column.index === 1) {
          data.cell.styles.halign = 'center'
          data.cell.styles.valign = 'middle'
        }

        // Ocultar texto padrão do cabeçalho das disciplinas para desenhar manual
        if (data.section === 'head' && data.column.index > 1) {
          data.cell.text = []
        }

        if (data.section === 'body' && data.column.index > 1) {
          const status = data.cell.raw
          if (status === 'AP' || status === 'AR' || status === 'AC') {
            data.cell.styles.textColor = [22, 163, 74]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'RC') {
            data.cell.styles.textColor = [234, 88, 12]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'DP') {
            data.cell.styles.textColor = [220, 38, 38]
            data.cell.styles.fontStyle = 'bold'
          } else if (status === 'DS' || status === 'DS_U' || status === 'CO') {
            data.cell.styles.textColor = [107, 114, 128]
          }
        }
      },
      didDrawCell: function(data: any) {
        if (data.section === 'head' && data.column.index > 1) {
          const doc = data.doc
          const text = String(data.cell.raw)
          
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(8)
          
          // Desenhar texto vertical (90 graus)
          // Ajuste fino de posição: x no centro da célula, y na base
          doc.text(text, data.cell.x + data.cell.width / 2 + 1, data.cell.y + data.cell.height - 3, { angle: 90 })
        }
      }
    })

    // Rodapé
    const finalY = (doc as any).lastAutoTable.finalY || 48
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      148,
      finalY + 10,
      { align: 'center' }
    )

    // Gerar PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-status-${turma.nome.replace(/\s+/g, '-')}.pdf"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json(
      { 
        message: 'Erro ao gerar PDF', 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"

interface Disciplina {
  id: string
  nome: string
}

interface NotaResultado {
  id: string
  nota: number
  nota1?: number | null
  nota2?: number | null
  nota3?: number | null
  notaRecuperacao: number | null
  status: string
  isDesistenteUnid1?: boolean
  isDesistenteUnid2?: boolean
  isDesistenteUnid3?: boolean
  estudanteId: string
  estudanteNome: string
  disciplinaId: string
  disciplinaNome: string
}

type UnitOption = 'UNIDADE_1' | 'UNIDADE_2' | 'UNIDADE_3' | 'FINAL'

export default function ResultadosTurmaClient({
  turmaId,
  turmaNome,
  disciplinas,
  initialNotas
}: {
  turmaId: string
  turmaNome: string
  disciplinas: Disciplina[]
  initialNotas: NotaResultado[]
}) {
  const [selectedUnit, setSelectedUnit] = useState<UnitOption>('FINAL')

  // Helper para calcular status/cor
  const calculateCellData = (n: NotaResultado | undefined, unit: UnitOption) => {
    if (!n) return { value: '-', color: 'bg-white', textClass: 'text-gray-300' }

    // Caso 1: Desistência Geral da Disciplina
    if (n.status === 'DESISTENTE') {
      return { value: 'DES', color: 'bg-gray-100 print:bg-gray-200', textClass: 'text-gray-500 font-bold' }
    }

    let value: number | string = '-'
    let isPositive = false

    if (unit === 'UNIDADE_1') {
      if (n.isDesistenteUnid1) return { value: 'DES', color: 'bg-gray-100 print:bg-gray-200', textClass: 'text-gray-500 font-bold' }
      value = n.nota1 ?? '-'
    } else if (unit === 'UNIDADE_2') {
      if (n.isDesistenteUnid2) return { value: 'DES', color: 'bg-gray-100 print:bg-gray-200', textClass: 'text-gray-500 font-bold' }
      value = n.nota2 ?? '-'
    } else if (unit === 'UNIDADE_3') {
      if (n.isDesistenteUnid3) return { value: 'DES', color: 'bg-gray-100 print:bg-gray-200', textClass: 'text-gray-500 font-bold' }
      value = n.nota3 ?? '-'
    } else { // FINAL
      // Caso todas as unidades sejam 'DES', a final é 'DES'
      if (n.isDesistenteUnid1 && n.isDesistenteUnid2 && n.isDesistenteUnid3) {
        return { value: 'DES', color: 'bg-gray-100 print:bg-gray-200', textClass: 'text-gray-500 font-bold' }
      }
      
      // Se houver algum DES, a média já veio calculada do banco
      value = n.nota
    }

    if (value === '-') {
      return { value: '-', color: 'bg-white', textClass: 'text-gray-300' }
    }

    isPositive = (value as number) >= 5

    const formattedValue = typeof value === 'number' ? value.toFixed(1).replace('.', ',') : value

    // Cores modernas (Pastel) para tela, e forçar print-color-adjust
    const bgColor = isPositive ? 'bg-blue-100 print:bg-gray-100' : 'bg-red-100 print:bg-gray-300'
    const textColor = isPositive ? 'text-blue-900 print:text-black' : 'text-red-900 print:text-black'

    return { value: formattedValue, color: bgColor, textClass: textColor }
  }

  // Organizar dados em matriz
  const matrixData = useMemo(() => {
    const estudantesMap = new Map<string, { id: string, nome: string, notas: Record<string, NotaResultado> }>()

    initialNotas.forEach(nota => {
      if (!estudantesMap.has(nota.estudanteId)) {
        estudantesMap.set(nota.estudanteId, {
          id: nota.estudanteId,
          nome: nota.estudanteNome,
          notas: {}
        })
      }
      estudantesMap.get(nota.estudanteId)!.notas[nota.disciplinaId] = nota
    })

    return Array.from(estudantesMap.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [initialNotas])

  return (
    <div className="min-h-screen bg-white print:bg-white flex flex-col p-4 sm:p-8 print:p-0 print:block overflow-x-hidden">
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          /* Remove background colors and shadows that might interfere */
          .print-no-bg { background-color: transparent !important; }
          
          /* Ensure the title and table stay together */
          header {
            display: block !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin-bottom: 10px !important;
          }

          /* Reset all containers that might have flex/grid which breaks page flow */
          div:not(.hidden):not(.print\:hidden), main:not(.hidden):not(.print\:hidden), section:not(.hidden):not(.print\:hidden) {
            display: block !important;
            position: static !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
          }

          table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .no-print-sticky {
            position: static !important;
            outline: none !important;
            background-color: white !important;
          }
        }
      `}</style>
      
      {/* Header Fixo */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:mb-4 print:flex-col print:items-start">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/resultados"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-none print:text-xl uppercase">
              Resultados - {turmaNome}
              <span className="hidden print:inline ml-2 text-gray-700">
                - {selectedUnit === 'FINAL' ? 'FINAL' : (
                  selectedUnit === 'UNIDADE_1' ? 'I UNIDADE' :
                  selectedUnit === 'UNIDADE_2' ? 'II UNIDADE' :
                  selectedUnit === 'UNIDADE_3' ? 'III UNIDADE' : selectedUnit
                )}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 print:hidden">
              Relatório de Notas - {selectedUnit.replace('UNIDADE_', 'Unidade ').replace('FINAL', 'Final')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 print:hidden">
           {/* Unit Selector */}
           <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['UNIDADE_1', 'UNIDADE_2', 'UNIDADE_3', 'FINAL'] as UnitOption[]).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setSelectedUnit(unit)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedUnit === unit
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {unit === 'FINAL' ? 'FINAL' : unit.replace('UNIDADE_', 'U')}
                </button>
              ))}
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Imprimir</span>
            </button>
        </div>
      </header>

      {/* Tabela */}
      <div className="flex-1 overflow-auto print:overflow-visible print:mt-0 table-container">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-collapse border border-gray-200 print:border-black">
            <thead>
              <tr className="bg-gray-50 print:bg-white text-black">
                {/* Coluna de Numeração */}
                <th className="sticky left-0 top-0 z-20 bg-gray-50 print:bg-white border border-gray-200 print:border-black p-1 w-8 text-center align-bottom no-print-sticky">
                  <span className="text-[10px] font-bold">Nº</span>
                </th>

                {/* Nome do Aluno */}
                <th className="sticky left-0 top-0 z-20 bg-gray-50 print:bg-white border border-gray-200 print:border-black p-3 text-left min-w-[200px] max-w-[250px] align-bottom outline outline-1 outline-gray-200 print:outline-none no-print-sticky">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Nome do Aluno</span>
                </th>

                {/* Disciplinas */}
                {disciplinas.map(d => (
                  <th key={d.id} className="sticky top-0 z-10 bg-gray-50 print:bg-white border border-gray-200 print:border-black w-10 min-w-[40px] align-bottom p-1 outline outline-1 outline-gray-200 print:outline-none no-print-sticky">
                     <div className="h-64 flex items-end justify-center pb-2 print:h-48">
                       <span 
                         className="text-[10px] font-bold text-gray-700 uppercase whitespace-nowrap print:text-black line-clamp-1"
                         style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                         title={d.nome}
                       >
                         {d.nome}
                       </span>
                    </div>
                  </th>
                ))}

                {/* Situação */}
                <th className="sticky top-0 z-10 bg-gray-50 print:bg-white border border-gray-200 print:border-black p-2 w-24 min-w-[90px] align-bottom outline outline-1 outline-gray-200 print:outline-none no-print-sticky">
                  <div className="w-full h-full flex items-end justify-center pb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider print:text-black">SITUAÇÃO</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {matrixData.map((aluno, idx) => {
                 // Cálculo da Situação Dinâmica
                 let situacao = 'AP'
                 const notasDoAluno = disciplinas.map(d => aluno.notas[d.id])
                 
                 for (const n of notasDoAluno) {
                    const data = calculateCellData(n, selectedUnit)
                    // Se for um número e menor que 5, fica em REC
                    if (typeof data.value === 'string' && data.value !== '-') {
                        const numericValue = parseFloat(data.value.replace(',', '.'))
                        if (numericValue < 5) {
                            situacao = 'REC'
                            break
                        }
                    } else if (typeof data.value === 'number' && data.value < 5) {
                        situacao = 'REC'
                        break
                    }
                 }

                 return (
                  <tr key={aluno.id} className="hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                    {/* Número */}
                    <td className="border border-gray-200 print:border-black p-2 text-center text-[10px] font-bold no-print-sticky bg-white print:bg-white">
                      {idx + 1}
                    </td>

                    {/* Nome */}
                    <td className={`
                      sticky left-0 z-10 bg-white print:bg-white border border-gray-200 print:border-black px-3 py-2 
                      text-xs font-medium text-gray-900 whitespace-nowrap outline outline-1 outline-gray-200 print:outline-none no-print-sticky 
                      ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30 print:bg-white'}
                    `}>
                      {aluno.nome.toUpperCase()}
                    </td>

                    {/* Notas */}
                    {disciplinas.map(d => {
                      const nota = aluno.notas[d.id]
                      const { value, color, textClass } = calculateCellData(nota, selectedUnit)
                      
                      return (
                        <td 
                          key={d.id} 
                          className={`border border-gray-200 print:border-black p-1 text-center text-[11px] h-8 ${color}`}
                        >
                          <span className={`${textClass} font-medium block`}>{value}</span>
                        </td>
                      )
                    })}

                    {/* Situação */}
                    <td className={`border border-gray-200 print:border-black px-2 py-1 text-center text-[10px] font-bold print:text-black ${situacao === 'AP' ? 'text-blue-700' : 'text-red-700'}`}>
                      {situacao}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Print */}
      <div className="hidden print:block mt-4 text-[10px] text-center text-gray-500">
        <p>Documento gerado em {new Date().toLocaleDateString()} pelo sistema EduClass.</p>
      </div>
    </div>
  )
}

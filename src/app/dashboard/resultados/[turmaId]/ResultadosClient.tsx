"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Download, CheckCircle2, FileText, GraduationCap, AlertTriangle, TrendingDown, Info, Printer } from "lucide-react"
import TeacherTipsModal from "@/components/TeacherTipsModal"
import { analyzeRisk } from "@/lib/risk-analysis"

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

type UnitOption = 'FINAL' | 'UNIDADE_1' | 'UNIDADE_2' | 'UNIDADE_3'

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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const abreviarNome = (nome: string) => {
    const nomeUpper = nome.toUpperCase()
    const mapa: Record<string, string> = {
      'ALGORITMOS E LINGUAGEM DE PROGRAMAÇÃO': 'Algoritmos e Linguagem P.',
      'FUNDAMENTOS DA COMPUTAÇÃO': 'Fund. da Computação',
      'INICIAÇÃO CIENTÍFICA': 'Inic. Científica',
      'LÍNGUA PORTUGUESA': 'Português',
      'EDUCAÇÃO FÍSICA': 'Ed. Física',
      'BANCO DE DADOS': 'Banco de Dados',
      'EDUCAÇÃO DIGITAL E MIDIÁTICA': 'Ed. Digital e Midiática',
      'HISTÓRIA DA BAHIA': 'Hist. da Bahia',
      'FUNDAMENTOS DE ARQUITETURA DE COMPUTADORES': 'Arq. de Computadores',
      'PROJETO TECNOLOGIAS SOCIAIS': 'Tec. Sociais'
    }

    if (mapa[nomeUpper]) return mapa[nomeUpper]
    if (nome.length > 25) {
      return nome.substring(0, 22) + '...'
    }
    return nome
  }

  const getStatusConfig = (status: string, notaValue?: number) => {
    // Se for modo numérico (Unidades)
    if (status === 'NUMERIC') {
        if (notaValue === undefined || notaValue === null) return { color: 'text-slate-300', text: 'font-normal', label: '-' }
        if (notaValue >= 5) return { color: 'text-emerald-600', text: 'font-bold', label: notaValue.toFixed(1) }
        return { color: 'text-rose-600', text: 'font-bold', label: notaValue.toFixed(1) }
    }

    // Modo Status (Final)
    switch (status) {
      case 'AP':
      case 'APROVADO':
        return { color: 'bg-emerald-500', text: 'text-white', label: 'AP' }
      case 'RC':
      case 'RECUPERACAO':
      case 'RECU_FINAL':
        return { color: 'bg-amber-500', text: 'text-white', label: 'RC' }
      case 'AR':
      case 'APROVADO_RECUPERACAO':
        return { color: 'bg-emerald-600', text: 'text-white', label: 'AR' }
      case 'AC':
      case 'APROVADO_CONSELHO':
      case 'CONSELHO':
        return { color: 'bg-blue-600', text: 'text-white', label: 'AC' }
      case 'DP':
      case 'DEPENDENCIA':
        return { color: 'bg-rose-600', text: 'text-white', label: 'DP' }
      case 'DS':
      case 'DESISTENTE':
        return { color: 'bg-slate-800', text: 'text-white', label: 'DS' }
      case 'CO':
      case 'CONSERVADO':
        return { color: 'bg-slate-400', text: 'text-white', label: 'CO' }
      default:
        return { color: 'bg-slate-100', text: 'text-slate-400', label: '-' }
    }
  }

  const renderCellContent = (n: NotaResultado | undefined) => {
    if (!n) return <span className="text-slate-200">/</span>

    if (selectedUnit === 'FINAL') {
        let label = '-'
        let statusKey = n.status

        // Lógica de exibição do status
        const isPositive = n.nota >= 5
        if (n.status === 'APROVADO' || isPositive) { statusKey = 'APROVADO'; label = 'AP'; }
        else if (n.status === 'RECU_FINAL' || !isPositive) { statusKey = 'RECUPERACAO'; label = 'RC'; }
        
        if (n.status === 'CONSELHO') { statusKey = 'CONSELHO'; label = 'AC'; }
        if (n.status === 'DESISTENTE') { statusKey = 'DESISTENTE'; label = 'DS'; }
        
        const config = getStatusConfig(statusKey)
        
        return (
            <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${config.color} ${config.text} shadow-sm`}>
              {label}
            </span>
        )
    }

    // Lógica para Unidades
    let value: number | null | undefined = null
    let isDesistente = false

    if (selectedUnit === 'UNIDADE_1') {
        value = n.nota1
        isDesistente = !!n.isDesistenteUnid1
    } else if (selectedUnit === 'UNIDADE_2') {
        value = n.nota2
        isDesistente = !!n.isDesistenteUnid2
    } else if (selectedUnit === 'UNIDADE_3') {
        value = n.nota3
        isDesistente = !!n.isDesistenteUnid3
    }

    if (isDesistente) return <span className="text-slate-900 font-bold text-xs">DS</span>
    
    if (value === null || value === undefined) return <span className="text-slate-300">-</span>
    
    const config = getStatusConfig('NUMERIC', value)
    
    return (
        <span className={`text-xs ${config.color} ${config.text}`}>
            {config.label}
        </span>
    )
  }

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

  const resultTips = [
    {
      title: "Visualização Premium",
      description: "Agora você tem uma visão unificada e moderna dos resultados.",
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-600" />,
      color: "bg-emerald-600"
    }
  ]

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <TeacherTipsModal storageKey="seen_tips_resultados_v2" title="Novo Visual de Resultados" tips={resultTips} />
      
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <Link
                href="/dashboard/resultados"
                className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm hover:translate-x-[-2px]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-2 mb-0.5">
                  <h1 className="text-2xl font-black text-black tracking-tight uppercase">RESULTADO - {turmaNome}</h1>
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-md uppercase tracking-widest leading-none">
                    Realtime
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest flex items-center">
                  <span className="text-blue-600 mr-2 font-bold">{turmaNome}</span>
                  • Relatório de Notas • {selectedUnit.replace('UNIDADE_', 'Unidade ').replace('FINAL', 'Final')}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-100/50 p-1 rounded-2xl flex items-center border border-slate-200/50 shadow-inner">
                {[
                  { id: 'FINAL', label: 'Status', icon: CheckCircle2 },
                  { id: 'UNIDADE_1', label: 'Und 1', icon: FileText },
                  { id: 'UNIDADE_2', label: 'Und 2', icon: FileText },
                  { id: 'UNIDADE_3', label: 'Und 3', icon: FileText }
                ].map((item) => {
                  const Icon = item.icon
                  const active = selectedUnit === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedUnit(item.id as UnitOption)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-[0.8rem] text-xs font-bold transition-all ${
                        active 
                        ? 'bg-black text-white shadow-lg active:scale-95' 
                        : 'text-slate-500 hover:text-black hover:bg-white/50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span className="uppercase tracking-wide">{item.label}</span>
                    </button>
                  )
                })}
              </div>

              <a
                href={`/api/relatorio/resultados/${turmaId}/pdf?unit=${selectedUnit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 font-bold text-xs uppercase tracking-widest"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Compact Summary & Legend Row */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Metrics */}
          <div className="flex items-center space-x-6 px-2">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estudantes</p>
               <p className="text-2xl font-bold text-black leading-none">{matrixData.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disciplinas</p>
               <p className="text-2xl font-bold text-black leading-none">{disciplinas.length}</p>
            </div>
          </div>

          {/* Compact Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
             {[
               { id: 'AP', label: 'Aprovado', color: 'bg-emerald-500' },
               { id: 'RC', label: 'Recup', color: 'bg-amber-500' },
               { id: 'AR', label: 'Apr.Rec', color: 'bg-emerald-600' },
               { id: 'AC', label: 'Conselho', color: 'bg-blue-600' },
               { id: 'DP', label: 'Dep', color: 'bg-rose-600' },
               { id: 'DS', label: 'Desist', color: 'bg-slate-800' },
               { id: 'DS_U', badge: 'DS', label: 'Unid. Des', color: 'bg-white border border-slate-200', text: 'text-black' }
             ].map((item) => (
               <div key={item.id} className="flex items-center space-x-1.5" title={item.label}>
                 <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${item.color} ${item.text || 'text-white'}`}>
                   {item.badge || item.id}
                 </span>
                 <span className="text-[10px] font-medium text-slate-500 uppercase">{item.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Ultra Compact Matriz */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-2 py-2 text-center text-[9px] font-bold text-slate-400 uppercase sticky left-0 bg-slate-50/95 backdrop-blur z-20 w-10 border-r border-slate-200">
                    #
                  </th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-black uppercase sticky left-8 bg-white z-30 min-w-[250px] border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] whitespace-nowrap">
                    Estudante
                  </th>
                  {disciplinas.map((disc) => (
                    <th key={disc.id} className="w-11 min-w-[2.75rem] max-w-[2.75rem] px-0 py-2 align-bottom h-24 border-r border-slate-100 last:border-0">
                      <div className="flex items-center justify-center h-full w-full">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 whitespace-nowrap overflow-hidden text-ellipsis max-h-[85px]">
                          {abreviarNome(disc.nome)}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="w-24 px-2 py-2 text-center text-[9px] font-bold text-blue-600 uppercase sticky right-0 bg-slate-50/95 backdrop-blur z-20 border-l border-slate-200">
                    Predição IA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.length === 0 ? (
                  <tr>
                    <td colSpan={disciplinas.length + 3} className="py-12 text-center text-slate-400 font-medium uppercase tracking-widest text-xs">
                       Nenhum estudante nesta turma.
                    </td>
                  </tr>
                ) : (
                  matrixData.map((estudante, idx) => {
                    const notasDoAluno = disciplinas.map(d => estudante.notas[d.id])
                    
                    // Cálculo de Risco IA
                    let worstRisk: any = { level: 'NONE' };
                    for (const n of notasDoAluno) {
                        if (n) {
                            const analysis = analyzeRisk(n.nota1 ?? null, n.nota2 ?? null, n.nota3 ?? null);
                            if (worstRisk.level === 'NONE' || 
                               (analysis.level === 'CRITICAL') || 
                               (analysis.level === 'HIGH' && worstRisk.level !== 'CRITICAL') ||
                               (analysis.level === 'MEDIUM' && (worstRisk.level !== 'CRITICAL' && worstRisk.level !== 'HIGH'))) {
                              worstRisk = analysis;
                            }
                        }
                    }

                    const isEven = idx % 2 === 0
                    const isSelected = selectedStudentId === estudante.id
                    
                    let rowBg = isEven ? 'bg-white' : 'bg-slate-50/50'
                    if (isSelected) rowBg = '!bg-yellow-50'
                    
                    return (
                      <tr 
                        key={estudante.id} 
                        onClick={() => setSelectedStudentId(isSelected ? null : estudante.id)}
                        className={`group hover:bg-blue-50/30 transition-colors cursor-pointer ${rowBg}`}
                      >
                        <td className={`h-9 px-1 text-center text-[10px] font-medium text-slate-400 sticky left-0 group-hover:bg-blue-50/30 transition-colors z-10 border-r border-slate-100 ${rowBg}`}>
                          {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className={`h-9 px-3 text-xs font-bold text-black sticky left-8 z-20 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] whitespace-nowrap min-w-[250px] bg-white`}>
                           {estudante.nome.toUpperCase()}
                        </td>
                        {disciplinas.map((disc) => (
                          <td key={disc.id} className="w-11 min-w-[2.75rem] max-w-[2.75rem] h-9 px-0 text-center border-r border-slate-50 last:border-0">
                            <div className="flex items-center justify-center w-full h-full">
                              {renderCellContent(estudante.notas[disc.id])}
                            </div>
                          </td>
                        ))}
                        <td className={`h-9 px-2 text-center sticky right-0 bg-white border-l border-slate-100 group-hover:bg-blue-50/30 transition-colors z-10 ${rowBg}`}>
                           <div className={`
                             inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all
                             ${worstRisk.level === 'CRITICAL' ? 'bg-rose-50 border-rose-100' : 
                               worstRisk.level === 'HIGH' ? 'bg-orange-50 border-orange-100' :
                               worstRisk.level === 'MEDIUM' ? 'bg-amber-50 border-amber-100' :
                               'bg-slate-50 border-slate-100'}
                           `} title={worstRisk.message}>
                             {worstRisk.level === 'CRITICAL' && <AlertTriangle size={10} className="text-rose-600 animate-pulse" />}
                             {worstRisk.level === 'HIGH' && <TrendingDown size={10} className="text-orange-600" />}
                             {worstRisk.level === 'MEDIUM' && <Info size={10} className="text-amber-600" />}
                             
                             <span className={`text-[8px] font-black uppercase tracking-tight ${worstRisk.color || 'text-slate-400'}`}>
                               {worstRisk.level === 'NONE' ? '-' : 
                                worstRisk.level === 'CRITICAL' ? 'Crítico' :
                                worstRisk.level === 'HIGH' ? 'Alto' :
                                worstRisk.level === 'MEDIUM' ? 'Médio' : 'Baixo'}
                             </span>
                           </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

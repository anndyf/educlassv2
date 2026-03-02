"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, AlertCircle, Gavel, Loader2, ChevronDown, ChevronUp, CheckCircle2, Printer, X } from "lucide-react"

interface NotaConselho {
  id: string
  nota: number
  nota1?: number | null
  nota2?: number | null
  nota3?: number | null
  notaRecuperacao: number | null
  status: string
  estudanteId: string
  estudanteNome: string
  disciplinaId: string
  disciplinaNome: string
}

const STATUS_OPTIONS = [
  { value: 'APROVADO_RECUPERACAO', label: 'Aprovado na Recuperação', color: 'text-emerald-700' },
  { value: 'APROVADO_CONSELHO', label: 'Aprovado pelo Conselho', color: 'text-emerald-700' },
  { value: 'DEPENDENCIA', label: 'Dependência', color: 'text-blue-700' },
  { value: 'CONSERVADO', label: 'Conservado', color: 'text-rose-700' }
]

export default function ConselhoClasseClient({
  turmaId,
  turmaNome,
  turmaCurso,
  turmaTurno,
  notasConselho
}: {
  turmaId: string
  turmaNome: string
  turmaCurso?: string | null
  turmaTurno?: string | null
  notasConselho: NotaConselho[]
}) {
  const router = useRouter()
  const [decisoes, setDecisoes] = useState<Record<string, string>>(() => {
    // Inicializar com decisões já existentes no banco
    const initial: Record<string, string> = {}
    notasConselho.forEach(n => {
      if (['APROVADO_CONSELHO', 'DEPENDENCIA', 'CONSERVADO', 'APROVADO_RECUPERACAO'].includes(n.status)) {
        initial[n.id] = n.status
      }
    })
    return initial
  })
  const [notasRec, setNotasRec] = useState<Record<string, number | null>>(() => {
    const initial: Record<string, number | null> = {}
    notasConselho.forEach(n => {
      initial[n.id] = n.notaRecuperacao
    })
    return initial
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [showInstructions, setShowInstructions] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const toggleStudent = (id: string) => {
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedStudents(newExpanded)
  }

  const handleDecisaoChange = (notaId: string, status: string) => {
    // Se selecionar CONSERVADO em alguma, todas as disciplinas ficam como CONSERVADA
    if (status === 'CONSERVADO') {
      const nota = notasConselho.find(n => n.id === notaId)
      if (nota) {
        const confirmacao = window.confirm(
          `Atenção: Ao definir o aluno como CONSERVADO nesta disciplina, o sistema aplicará esta decisão para TODAS as outras disciplinas deste estudante (${nota.estudanteNome}).\n\nConfirmar decisão de CONSERVADO para todo o semestre?`
        )

        if (!confirmacao) return

        // Encontrar todas as notas do mesmo estudante e aplicar o status
        const notasDoEstudante = notasConselho.filter(n => n.estudanteId === nota.estudanteId)
        
        setDecisoes(prev => {
          const next = { ...prev }
          notasDoEstudante.forEach(n => {
            next[n.id] = 'CONSERVADO'
          })
          return next
        })
        return
      }
    }

    setDecisoes(prev => ({
      ...prev,
      [notaId]: status
    }))
  }

  const handleNotaRecChange = (notaId: string, valor: string) => {
    const num = valor === '' ? null : parseFloat(valor.replace(',', '.'))
    
    setNotasRec(prev => ({
      ...prev,
      [notaId]: isNaN(num as number) ? (valor === '' ? null : prev[notaId]) : num
    }))

    // Se a nota for maior ou igual a 5, marcar automaticamente como aprovado na recuperação
    if (num !== null && !isNaN(num) && num >= 5) {
      setDecisoes(prev => ({
        ...prev,
        [notaId]: 'APROVADO_RECUPERACAO'
      }))
    } else if (num !== null && !isNaN(num) && num < 5 && decisoes[notaId] === 'APROVADO_RECUPERACAO') {
        // Se a nota baixou de 5 e estava como aprovado na recup, removemos a decisão para voltar ao estado pendente
        setDecisoes(prev => {
          const next = { ...prev }
          delete next[notaId]
          return next
        })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirmModal(true)
  }

  const handleConfirmSave = async () => {
    setLoading(true)
    setShowConfirmModal(false)
    setMessage(null)

    try {
      const decisoesArray = Object.entries(decisoes).map(([notaId, status]) => ({
        notaId,
        novoStatus: status,
        novaNotaRec: notasRec[notaId]
      }))

      const response = await fetch('/api/conselho-classe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decisoes: decisoesArray })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Decisões do conselho salvas com sucesso!' })
        router.refresh()
        setTimeout(() => setMessage(null), 5000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Erro ao salvar decisões' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'APROVADO': 'Aprovado',
      'RECUPERACAO': 'Recuperação',
      'DESISTENTE': 'Desistente',
      'APROVADO_RECUPERACAO': 'Aprovado na Recup.',
      'APROVADO_CONSELHO': 'Aprovado Conselho',
      'DEPENDENCIA': 'Dependência',
      'CONSERVADO': 'Conservado'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADO':
      case 'APROVADO_RECUPERACAO':
      case 'APROVADO_CONSELHO':
        return 'text-emerald-700 bg-emerald-100'
      case 'RECUPERACAO':
        return 'text-orange-700 bg-orange-100'
      case 'DEPENDENCIA':
        return 'text-blue-700 bg-blue-100'
      case 'CONSERVADO':
        return 'text-rose-700 bg-rose-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Preparar dados para impressão em formato de tabela
  const studentsData = notasConselho.reduce((acc, nota) => {
    if (!acc[nota.estudanteId]) {
      acc[nota.estudanteId] = {
        nome: nota.estudanteNome,
        notas: []
      }
    }
    acc[nota.estudanteId].notas.push(nota)
    return acc
  }, {} as Record<string, { nome: string, notas: NotaConselho[] }>)

  // Obter lista única de disciplinas
  const disciplinas = Array.from(new Set(notasConselho.map(n => n.disciplinaNome))).sort()

  // Função para abreviar nomes de disciplinas muito longos
  const abreviarDisciplina = (nome: string) => {
    if (nome.length <= 20) return nome.toUpperCase()
    
    // Abreviações comuns
    const abreviacoes: Record<string, string> = {
      'ALGORITMOS E LÓGICA DE PROG.': 'ALGORITMOS',
      'BANCO DE DADOS': 'BD',
      'EDUCAÇÃO FÍSICA': 'ED. FÍSICA',
      'FUNDAMENTOS DA COMPUTAÇÃO': 'FUND. COMP.',
      'LÍNGUA PORTUGUESA': 'PORTUGUÊS',
      'INICIAÇÃO CIENTÍFICA': 'INIC. CIENTÍFICA',
      'MATEMÁTICA': 'MAT.',
      'SOCIOLOGIA': 'SOCIOL.'
    }
    
    // Verifica se existe abreviação específica
    const nomeUpper = nome.toUpperCase()
    if (abreviacoes[nomeUpper]) return abreviacoes[nomeUpper]
    
    // Se não, pega as primeiras palavras até 20 caracteres
    const palavras = nome.split(' ')
    let resultado = ''
    for (const palavra of palavras) {
      if ((resultado + palavra).length > 20) break
      resultado += (resultado ? ' ' : '') + palavra
    }
    return resultado.toUpperCase() || nome.substring(0, 20).toUpperCase()
  }

  return (
    <>
      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 1.5cm 1cm 1.5cm 1cm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .print-table {
            display: table !important;
          }
          
          /* Cabeçalho e rodapé em todas as páginas */
          @page {
            @top-left {
              content: "EduClass";
              font-size: 10px;
              font-weight: bold;
              color: #1e40af;
            }
            
            @top-right {
              content: "${turmaNome}";
              font-size: 9px;
              font-weight: 600;
            }
            
            @bottom-left {
              content: "Conselho de Classe Final";
              font-size: 8px;
              color: #6b7280;
            }
            
            @bottom-center {
              content: "Impresso em: " counter(date);
              font-size: 8px;
              color: #6b7280;
            }
            
            @bottom-right {
              content: "Página " counter(page) " de " counter(pages);
              font-size: 8px;
              color: #6b7280;
            }
          }
          
          /* Marca d'água EduClass */
          .print-watermark {
            position: fixed;
            bottom: 10mm;
            right: 10mm;
            font-size: 8px;
            color: #9ca3af;
            font-weight: 600;
            opacity: 0.5;
          }
        }
        
        .print-only {
          display: none;
        }
      `}</style>

      {/* Versão para impressão - Tabela */}
      <div className="print-only p-6">
        {/* Marca d'água */}
        <div className="print-watermark">
          Powered by EduClass
        </div>
        
        {/* Cabeçalho e Legenda lado a lado */}
        <div className="mb-3 flex items-start justify-between gap-6">
          {/* Identificação - Esquerda */}
          <div className="flex-1">
            <p className="text-[9px] font-bold text-gray-700 mb-1 uppercase leading-tight">
              Centro Territorial de Educação Profissional do Litoral Norte e Agreste Baiano
            </p>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-blue-700 font-black text-lg">EduClass</div>
              <div className="text-gray-400">|</div>
              <h1 className="text-xl font-black">Conselho de Classe Final</h1>
            </div>
            <h2 className="text-lg font-bold mb-0.5">{turmaNome}</h2>
            {turmaCurso && <p className="text-sm font-semibold text-gray-600">{turmaCurso} {turmaTurno && `- ${turmaTurno}`}</p>}
            <p className="text-xs text-gray-500 mt-0.5">Impresso em: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          
          {/* Legenda - Direita */}
          <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200" style={{minWidth: '450px'}}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[8px]">
              <span className="font-black text-gray-800 text-[9px] mr-1">LEGENDA:</span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-emerald-100 border border-emerald-400 font-black rounded text-emerald-900 text-[7px]">AR</span>
                <span className="font-semibold">Aprov. Recup.</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-emerald-200 border border-emerald-500 font-black rounded text-emerald-900 text-[7px]">AC</span>
                <span className="font-semibold">Aprov. Conselho</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-blue-100 border border-blue-400 font-black rounded text-blue-900 text-[7px]">DP</span>
                <span className="font-semibold">Dependência</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-rose-100 border border-rose-400 font-black rounded text-rose-900 text-[7px]">CO</span>
                <span className="font-semibold">Conservado</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 bg-amber-100 border border-amber-400 font-black rounded text-amber-900 text-[7px]">RC</span>
                <span className="font-semibold">Recuperação</span>
              </div>
            </div>
          </div>
        </div>
        
        <table className="print-table w-full border-collapse text-[9px]">
          <thead>
            <tr>
              <th className="border border-gray-400 px-2 bg-gray-200 font-black text-center text-[8px]" style={{minWidth: '120px', maxWidth: '120px', width: '120px', height: '100px', verticalAlign: 'middle'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                  ESTUDANTE
                </div>
              </th>
              {disciplinas.map((disc) => (
                <th key={disc} className="border border-gray-400 bg-gray-200 font-black text-center" style={{minWidth: '20px', maxWidth: '20px', width: '20px', height: '100px', padding: '8px 0'}}>
                  <div style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: '7px',
                    fontWeight: '900',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    margin: '0 auto'
                  }}>
                    {abreviarDisciplina(disc)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(studentsData)
              .sort(([, a], [, b]) => a.nome.localeCompare(b.nome))
              .map(([estudanteId, data], idx) => {
                // Criar mapa de disciplina -> nota para este aluno
                const notasPorDisciplina = data.notas.reduce((acc, nota) => {
                  acc[nota.disciplinaNome] = nota
                  return acc
                }, {} as Record<string, NotaConselho>)

                return (
                  <tr key={estudanteId}>
                    <td className="border border-gray-400 px-2 py-0.5 font-semibold text-left bg-gray-50 text-[10px] leading-tight" style={{maxWidth: '120px', width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      <span className="text-gray-500 mr-1 text-[8px]">{String(idx + 1).padStart(2, '0')}</span>
                      <span>{data.nome}</span>
                    </td>
                    {disciplinas.map((disc) => {
                      const nota = notasPorDisciplina[disc]
                      if (!nota) {
                        return <td key={disc} className="border border-gray-400 px-1 py-1 text-center bg-white">-</td>
                      }
                      
                      const statusAtual = decisoes[nota.id] || nota.status
                      const notaFinal = notasRec[nota.id] !== null && notasRec[nota.id] !== undefined 
                        ? notasRec[nota.id] 
                        : nota.notaRecuperacao
                      
                      let bgColor = 'bg-white'
                      let textColor = 'text-gray-900'
                      let statusAbrev = ''
                      
                      switch(statusAtual) {
                        case 'APROVADO_RECUPERACAO':
                          bgColor = 'bg-emerald-100'
                          textColor = 'text-emerald-900'
                          statusAbrev = 'AR'
                          break
                        case 'APROVADO_CONSELHO':
                          bgColor = 'bg-emerald-200'
                          textColor = 'text-emerald-900'
                          statusAbrev = 'AC'
                          break
                        case 'DEPENDENCIA':
                          bgColor = 'bg-blue-100'
                          textColor = 'text-blue-900'
                          statusAbrev = 'DP'
                          break
                        case 'CONSERVADO':
                          bgColor = 'bg-rose-100'
                          textColor = 'text-rose-900'
                          statusAbrev = 'CO'
                          break
                        case 'RECUPERACAO':
                          bgColor = 'bg-amber-50'
                          textColor = 'text-amber-900'
                          statusAbrev = 'RC'
                          break
                      }
                      
                      return (
                        <td key={disc} className={`border border-gray-400 px-1 py-1 text-center font-bold ${bgColor} ${textColor}`}>
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[8px] font-black">{statusAbrev}</span>
                            {notaFinal !== null && notaFinal !== undefined && (
                              <span className="text-[10px]">{notaFinal.toFixed(1)}</span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

    <div className="min-h-screen bg-gray-50 no-print">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start space-x-4">
            <Link
              href="/dashboard/conselho-classe"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{turmaNome}</h1>
                {turmaTurno && (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    {turmaTurno}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Conselho de Classe Final</span>
                {turmaCurso && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs font-bold text-pink-600 uppercase tracking-wide">{turmaCurso}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <form onSubmit={handleSubmit}>
          {/* Mensagem */}
          {message && (
            <div className={`mb-8 p-5 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300 ${
              message.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-900 shadow-sm' 
                : 'bg-rose-50 border border-rose-100 text-rose-900 shadow-sm'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 rounded-xl ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm tracking-tight">{message.text}</span>
              </div>
            </div>
          )}

          {/* Dashboard de Visão Geral */}
          <div className="mb-6 bg-white p-1.5 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/30 overflow-hidden">
            <div className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Métricas Rápidas */}
                {(() => {
                  const studentsData = notasConselho.reduce((acc, nota) => {
                    if (!acc[nota.estudanteId]) acc[nota.estudanteId] = []
                    acc[nota.estudanteId].push(nota)
                    return acc
                  }, {} as Record<string, NotaConselho[]>)

                  const total = Object.keys(studentsData).length
                  const pendentes = Object.entries(studentsData).filter(([id, notas]) => 
                    notas.some(n => !['APROVADO_CONSELHO', 'DEPENDENCIA', 'CONSERVADO', 'APROVADO_RECUPERACAO'].includes(decisoes[n.id] || n.status))
                  ).length
                  const concluidos = total - pendentes

                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
                        <div className="w-1 h-1 bg-slate-400 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{total} Alunos</span>
                      </div>
                      <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{concluidos} Concluídos</span>
                      </div>
                      <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center space-x-2">
                        <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{pendentes} Pendentes</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Botões de Ação */}
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white text-slate-700 border border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Imprimir</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      showInstructions 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'bg-white text-slate-400 border border-slate-200 hover:border-pink-300 hover:text-pink-500'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>{showInstructions ? 'Ocultar Guia' : 'Como Avaliar?'}</span>
                  </button>
                </div>
              </div>

              {/* Instruções Expansíveis */}
              {showInstructions && (
                <div className="mt-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start space-x-5">
                    <div className="p-3 bg-pink-500 rounded-2xl shadow-lg shadow-pink-200">
                      <Gavel className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">Guia Rápido do Conselho</h3>
                      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Passo 01</span>
                          <p className="text-xs text-slate-500 leading-relaxed">Clique no nome do aluno para abrir a lista de matérias com pendência.</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Passo 02</span>
                          <p className="text-xs text-slate-500 leading-relaxed">Ajuste a <b>Nota Rec.</b> se necessário. Notas acima de 5.0 aprovam na hora.</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Passo 03</span>
                          <p className="text-xs text-slate-500 leading-relaxed">Defina a <b>Decisão Final</b> e use o botão <b>Gravar</b> no rodapé fixo.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Legenda Minimalista */}
              <div className="mt-8 pt-6 border-t border-slate-50 flex flex-wrap items-center gap-8 px-2">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Legenda de Estados:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aprovado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dependência</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conservado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recuperação</span>
                </div>
              </div>
            </div>
          </div>

          {/* Listagem por Estudante */}
          <div className="space-y-6">
            {Object.entries(
              notasConselho.reduce((acc, nota) => {
                if (!acc[nota.estudanteId]) {
                  acc[nota.estudanteId] = {
                    nome: nota.estudanteNome,
                    notas: []
                  }
                }
                acc[nota.estudanteId].notas.push(nota)
                return acc
              }, {} as Record<string, { nome: string, notas: NotaConselho[] }>)
            ).map(([estudanteId, data]) => {
              const isExpanded = expandedStudents.has(estudanteId)
              const pendentesCount = data.notas.filter(n => 
                !['APROVADO_CONSELHO', 'DEPENDENCIA', 'CONSERVADO', 'APROVADO_RECUPERACAO'].includes(decisoes[n.id] || n.status)
              ).length
              const resolvidasCount = data.notas.length - pendentesCount
              const todasResolvidas = pendentesCount === 0

              // Estatísticas Estáveis (O que trouxe o aluno aqui)
              const recTotal = data.notas.filter(n => n.notaRecuperacao !== null || n.status === 'RECUPERACAO' || n.status === 'APROVADO_RECUPERACAO').length
              const levadasAoConselho = data.notas.filter(n => n.status === 'RECUPERACAO' || n.status === 'APROVADO_RECUPERACAO').length

              // Estatísticas Dinâmicas (Progresso do Conselho)
              const recAprovado = data.notas.filter(n => {
                const statusFinal = decisoes[n.id] || n.status
                const notaAtual = notasRec[n.id]
                return (statusFinal === 'APROVADO_RECUPERACAO' || (notaAtual !== null && notaAtual >= 5))
              }).length

              return (
                <div 
                  key={estudanteId} 
                  className={`bg-white rounded-2xl shadow-sm transition-all duration-300 border ${
                    isExpanded ? 'shadow-md border-slate-200' : 'border-slate-100'
                  } ${
                    todasResolvidas ? 'bg-emerald-50/10 border-emerald-100' : ''
                  }`}
                >
                  {/* Cabeçalho do Card (Toggle) */}
                  <button
                    type="button"
                    onClick={() => toggleStudent(estudanteId)}
                    className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors rounded-2xl ${
                      isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-all ${
                        todasResolvidas ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {todasResolvidas ? <CheckCircle2 className="w-5 h-5" /> : data.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className={`text-base font-bold tracking-tight ${
                          todasResolvidas ? 'text-emerald-900' : 'text-slate-800'
                        }`}>
                          {data.nome}
                        </h3>
                        {/* Status Detalhado */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {recTotal > 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                              {recTotal} {recTotal === 1 ? 'Recuperação' : 'Recuperações'} ({recAprovado} Passou)
                            </span>
                          )}
                          
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                             todasResolvidas ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-pink-100 text-pink-600 border border-pink-200'
                          }`}>
                            {levadasAoConselho} {levadasAoConselho === 1 ? 'Matéria' : 'Matérias'} p/ Conselho
                          </span>

                          {!isExpanded && (
                             <span className="text-[10px] font-medium text-slate-400 ml-1">
                               {resolvidasCount}/{data.notas.length} Resolvidas
                             </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                       {todasResolvidas && !isExpanded && (
                          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                             <CheckCircle2 className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-bold uppercase tracking-wider">Concluído</span>
                          </div>
                       )}
                       <div className={`p-1.5 rounded-lg border transition-all ${isExpanded ? 'bg-white border-pink-200 text-pink-500 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                         {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                       </div>
                    </div>
                  </button>

                  {/* Listagem de Disciplinas (Sanfonado) */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-10">#</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest text-nowrap">Disciplina</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Média Anual</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest text-nowrap">Nota Rec.</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-pink-500 uppercase tracking-widest">Decisão</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-0">
                            {data.notas
                              .map((nota, originalIndex) => ({ ...nota, originalIndex }))
                              .sort((a, b) => {
                                const aResolvida = ['APROVADO_CONSELHO', 'DEPENDENCIA', 'CONSERVADO', 'APROVADO_RECUPERACAO'].includes(decisoes[a.id] || a.status)
                                const bResolvida = ['APROVADO_CONSELHO', 'DEPENDENCIA', 'CONSERVADO', 'APROVADO_RECUPERACAO'].includes(decisoes[b.id] || b.status)
                                if (aResolvida && !bResolvida) return 1
                                if (!aResolvida && bResolvida) return -1
                                return 0
                              })
                              .map((nota) => {
                                const statusValue = decisoes[nota.id] || ''
                                const isResolvida = ['APROVADO_CONSELHO', 'DEPENDENCIA', 'CONSERVADO', 'APROVADO_RECUPERACAO'].includes(statusValue || nota.status)
                                
                                // Definir cores dinâmicas para o select
                                let selectBg = 'bg-white border-slate-200 text-slate-500'
                                let iconColor = 'text-slate-400'
                                
                                if (statusValue.includes('APROVADO')) {
                                  selectBg = 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  iconColor = 'text-emerald-500'
                                } else if (statusValue === 'DEPENDENCIA') {
                                  selectBg = 'bg-blue-50 border-blue-200 text-blue-700'
                                  iconColor = 'text-blue-500'
                                } else if (statusValue === 'CONSERVADO') {
                                  selectBg = 'bg-rose-50 border-rose-200 text-rose-700'
                                  iconColor = 'text-rose-500'
                                }

                                return (
                                  <tr key={nota.id} className={`group transition-all hover:bg-slate-100/50 even:bg-slate-50/80 ${isResolvida ? 'opacity-70' : ''}`}>
                                    <td className="px-4 py-4 rounded-l-xl text-xs font-bold text-slate-400">
                                      {nota.originalIndex + 1}
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-[15px] font-semibold text-slate-700">
                                        {nota.disciplinaNome}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <span className={`text-base font-bold font-mono ${nota.nota < 5 ? 'text-rose-600' : 'text-slate-600'}`}>
                                        {nota.nota.toFixed(1)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <input
                                        type="text"
                                        defaultValue={notasRec[nota.id]?.toFixed(1) || ''}
                                        onBlur={(e) => handleNotaRecChange(nota.id, e.target.value)}
                                        className="w-16 h-8 text-center bg-rose-50 text-rose-700 rounded-md text-sm font-bold border border-rose-100 focus:border-rose-300 focus:ring-2 focus:ring-rose-50 outline-none transition-all"
                                        placeholder="---"
                                      />
                                    </td>
                                    <td className="px-4 py-4 rounded-r-xl text-left">
                                      <div className="relative inline-flex items-center">
                                        <select
                                          value={statusValue}
                                          onChange={(e) => handleDecisaoChange(nota.id, e.target.value)}
                                          className={`w-[212px] h-9 px-3 pr-8 rounded-lg outline-none font-black text-[10px] uppercase tracking-wider transition-all appearance-none cursor-pointer border ${selectBg} ${!statusValue ? 'focus:border-pink-300 focus:ring-2 focus:ring-pink-50' : ''}`}
                                        >
                                          <option value="" className="text-slate-400">Definir decisão...</option>
                                          {STATUS_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value} className="text-slate-900 font-bold">
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                        <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${iconColor}`}>
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer Fixo */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 py-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="bg-pink-50 p-3 rounded-2xl border border-pink-100 shadow-inner">
                  <Gavel className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Fechamento de Conselhos</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center">
                     <span className="w-2 h-2 bg-pink-500 rounded-full mr-2 animate-pulse" />
                     {notasConselho.length} Registros totais nesta turma
                   </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <button
                  type="submit"
                  disabled={loading || Object.keys(decisoes).length === 0}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-4 bg-pink-600 text-white px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-pink-700 transition-all shadow-xl shadow-pink-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed group border-b-4 border-pink-800"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                  <span className="text-xs">{loading ? 'Sincronizando...' : 'Gravar Decisões Agora'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
        {/* Modal de Confirmação */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Revisar Decisões</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Confira os dados antes de consolidar no sistema</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-inner font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-slate-200/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Estudante / Disciplina</th>
                        <th className="px-6 py-4 text-center">Nota Rec.</th>
                        <th className="px-6 py-4 text-center">Decisão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {Object.entries(decisoes).map(([notaId, status]) => {
                        const nota = notasConselho.find(n => n.id === notaId)
                        if (!nota) return null
                        
                        const statusOpt = STATUS_OPTIONS.find(o => o.value === status)
                        const notaRecVal = notasRec[notaId]

                        return (
                          <tr key={notaId}>
                            <td className="px-6 py-4">
                              <p className="font-black text-slate-900 text-xs uppercase">{nota.estudanteNome}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{nota.disciplinaNome}</p>
                            </td>
                            <td className="px-6 py-4 text-center font-black text-slate-700 text-xs">
                              {notaRecVal !== null && notaRecVal !== undefined ? notaRecVal.toFixed(1) : '-'}
                            </td>
                            <td className={`px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest ${statusOpt?.color || 'text-slate-900'}`}>
                              {statusOpt?.label || status}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex justify-end space-x-4 bg-slate-50 rounded-b-[2.5rem]">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all text-sm uppercase tracking-widest"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-10 py-3 rounded-2xl bg-pink-600 text-white font-black uppercase tracking-widest hover:bg-pink-700 shadow-xl shadow-pink-200 transition-all flex items-center space-x-3 active:scale-95 text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Gravar Permanentemente</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  )
}

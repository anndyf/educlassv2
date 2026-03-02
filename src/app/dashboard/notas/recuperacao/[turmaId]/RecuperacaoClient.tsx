"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, AlertCircle, CheckCircle2, X, Info } from "lucide-react"

interface NotaRecuperacao {
  id: string
  nota: number
  estudanteId: string
  estudanteNome: string
  disciplinaId: string
  disciplinaNome: string
  notaRecuperacao?: number | null
}

export default function RecuperacaoTurmaClient({
  turmaId,
  turmaNome,
  notasRecuperacao,
  disciplinas
}: {
  turmaId: string
  turmaNome: string
  notasRecuperacao: NotaRecuperacao[]
  disciplinas: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("")
  
  // Estado principal das notas
  const [notas, setNotas] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    notasRecuperacao.forEach(n => {
      if (n.notaRecuperacao !== null && n.notaRecuperacao !== undefined) {
        initial[n.id] = n.notaRecuperacao.toString()
      }
    })
    return initial
  })

  // Estado para controle de alterações não salvas (original)
  const [originalNotas, setOriginalNotas] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    notasRecuperacao.forEach(n => {
      if (n.notaRecuperacao !== null && n.notaRecuperacao !== undefined) {
        initial[n.id] = n.notaRecuperacao.toString()
      }
    })
    return initial
  })

  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const hasUnsavedChanges = () => {
    return JSON.stringify(notas) !== JSON.stringify(originalNotas)
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [notas, originalNotas])

  const handleNotaChange = (notaId: string, valor: string) => {
    setNotas(prev => ({
      ...prev,
      [notaId]: valor
    }))
  }

  const toggleNaoRealizou = (notaId: string, checked: boolean) => {
    setNotas(prev => ({
      ...prev,
      [notaId]: checked ? '-1' : ''
    }))
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
      const relevantNotaIds = new Set(notasRecuperacao
        .filter(n => n.disciplinaId === disciplinaSelecionada)
        .map(n => n.id))

      const notasArray = Object.entries(notas)
        .filter(([notaId]) => relevantNotaIds.has(notaId))
        .map(([notaId, notaRecup]) => ({
          notaId,
          notaRecuperacao: parseFloat(notaRecup)
        }))
        .filter(n => !isNaN(n.notaRecuperacao))

      const response = await fetch('/api/notas/recuperacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notas: notasArray })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notas de recuperação salvas com sucesso!' })
        setOriginalNotas(JSON.parse(JSON.stringify(notas)))
        router.refresh()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Erro ao lançar notas' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' })
    } finally {
      setLoading(false)
    }
  }

  const disciplinaObj = disciplinas.find(d => d.id === disciplinaSelecionada)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/notas/recuperacao"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {disciplinaSelecionada 
                  ? `${turmaNome} • ${disciplinaObj?.nome}`
                  : `Recuperação: ${turmaNome}`}
              </h1>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-600/70">Lançamento de Recuperação Final</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Mensagem */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Seleção de Disciplina */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <label htmlFor="disciplina" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Selecione a Disciplina</label>
                <select
                  id="disciplina"
                  value={disciplinaSelecionada}
                  onChange={(e) => setDisciplinaSelecionada(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 transition-all cursor-pointer"
                  required
                >
                  <option value="">Escolha uma disciplina para lançar...</option>
                  {disciplinas.map((disc) => (
                    <option key={disc.id} value={disc.id}>{disc.nome}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3 max-w-sm">
                 <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
                   <strong>Dica:</strong> Alunos com média abaixo de 5.0 aparecem automaticamente nesta lista. Digite a nota ou marque "Não Realizou".
                 </p>
              </div>
            </div>
          </div>

          {!disciplinaSelecionada ? (
            <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-24 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <AlertCircle className="w-10 h-10 text-slate-300" />
               </div>
               <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">Aguardando Seleção</h3>
               <p className="text-slate-400 max-w-sm mx-auto font-medium">
                 Selecione uma disciplina acima para visualizar os estudantes em recuperação.
               </p>
            </div>
          ) : (
            <>
              {/* Tabela de Recuperação */}
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-slate-50/50 border-b border-slate-200">
                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Estudantes</p>
                       <p className="text-3xl font-black text-slate-900">
                         {notasRecuperacao.filter(n => n.disciplinaId === disciplinaSelecionada).length}
                       </p>
                     </div>
                     <div className="h-12 w-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <AlertCircle className="w-6 h-6" />
                     </div>
                   </div>

                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all">
                     <div>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Recuperados</p>
                       <p className="text-3xl font-black text-emerald-600">
                         {notasRecuperacao.filter(n => n.disciplinaId === disciplinaSelecionada).reduce((acc, curr) => {
                           const val = parseFloat(notas[curr.id] || '0')
                           return (val >= 5 && notas[curr.id] !== '-1') ? acc + 1 : acc
                         }, 0)}
                       </p>
                     </div>
                     <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                       <CheckCircle2 className="w-6 h-6" />
                     </div>
                   </div>

                   <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
                     <div>
                       <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Conselho</p>
                       <p className="text-3xl font-black text-purple-600">
                         {notasRecuperacao.filter(n => n.disciplinaId === disciplinaSelecionada).reduce((acc, curr) => {
                             const val = parseFloat(notas[curr.id])
                             const temNota = notas[curr.id] !== undefined && notas[curr.id] !== ''
                             if (!temNota) return acc 
                             const isNaoRealizou = notas[curr.id] === '-1'
                             return (val < 5 || isNaoRealizou) ? acc + 1 : acc
                         }, 0)}
                       </p>
                     </div>
                     <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                        <TrendingUp className="w-6 h-6" size={24} />
                     </div>
                   </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                      <tr>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudante</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Média Anual</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Nota Rec.</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Faltou?</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Novo Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {notasRecuperacao
                        .filter(n => n.disciplinaId === disciplinaSelecionada)
                        .map((nota, index) => {
                        const valorAtual = notas[nota.id] || ''
                        const valorOriginal = originalNotas[nota.id]
                        const foiAlterado = valorAtual !== valorOriginal && valorOriginal !== undefined
                        const notaRecupNum = valorAtual ? parseFloat(valorAtual) : null
                        
                        let novoStatus = '-'
                        let statusColor = 'text-slate-300'
                        
                        if (notaRecupNum !== null && !isNaN(notaRecupNum)) {
                          if (notaRecupNum === -1) {
                             novoStatus = 'Não Realizou'
                             statusColor = 'text-slate-500 bg-slate-100 border-slate-200'
                          } else if (notaRecupNum >= 5) {
                            novoStatus = 'Aprovado (Rec)'
                            statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-100'
                          } else {
                            novoStatus = 'Conselho'
                            statusColor = 'text-purple-700 bg-purple-50 border-purple-100'
                          }
                        }

                        const isNaoRealizou = valorAtual === '-1'

                        return (
                          <tr key={nota.id} className={`group hover:bg-slate-50/50 transition-colors ${foiAlterado ? 'bg-orange-50/30' : ''}`}>
                            <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-slate-400">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                              <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors capitalize">
                                {nota.estudanteNome.toLowerCase()}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-black border border-red-100">
                                {nota.nota.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex justify-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  value={isNaoRealizou ? '' : valorAtual}
                                  disabled={isNaoRealizou}
                                  onChange={(e) => handleNotaChange(nota.id, e.target.value)}
                                  className={`w-20 h-10 px-2 text-center border-2 rounded-xl text-sm font-black transition-all ${
                                    isNaoRealizou 
                                      ? 'bg-slate-100 border-slate-200 text-slate-300' 
                                      : foiAlterado 
                                        ? 'border-orange-500 ring-2 ring-orange-100 bg-white' 
                                        : 'border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500'
                                  }`}
                                  placeholder={isNaoRealizou ? '-' : '0.0'}
                                />
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <input 
                                type="checkbox"
                                checked={isNaoRealizou}
                                onChange={(e) => toggleNaoRealizou(nota.id, e.target.checked)}
                                className="w-5 h-5 text-orange-600 rounded-lg border-slate-300 focus:ring-orange-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-8 py-5 text-center">
                              {novoStatus !== '-' ? (
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor}`}>
                                  {novoStatus}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Pendente</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    {hasUnsavedChanges() && (
                      <div className="flex items-center gap-2 text-orange-600 animate-pulse">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Alterações não salvas</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !hasUnsavedChanges()}
                    className="w-full md:w-auto flex items-center justify-center space-x-2 bg-slate-900 text-white px-10 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    <span className="font-bold text-sm">Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </>
          )} 
        </form>

        {/* Modal de Confirmação */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Revisar Alterações</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Confira os dados antes de consolidar no sistema</p>
                </div>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-inner">
                  <table className="w-full p-2">
                    <thead className="bg-slate-200/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4 text-left">Estudante</th>
                        <th className="px-6 py-4 text-center">Nota</th>
                        <th className="px-6 py-4 text-center">Status Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {notasRecuperacao
                        .filter(n => n.disciplinaId === disciplinaSelecionada)
                        .map(n => {
                          const valor = notas[n.id]
                          if (!valor && n.notaRecuperacao === null) return null
                          
                          // Só mostra no modal se houver mudança ou se já existir
                          const notaVal = parseFloat(valor)
                          let statusText = 'Pendente'
                          let statusColor = 'text-slate-400'
                          let displayNota = valor || '-'

                          if (valor === '-1') {
                            displayNota = 'Faltou'
                            statusText = 'Conselho'
                            statusColor = 'text-purple-600'
                          } else if (valor) {
                            if (notaVal >= 5) {
                              statusText = 'Aprovado'
                              statusColor = 'text-emerald-600'
                            } else {
                              statusText = 'Conselho'
                              statusColor = 'text-purple-600'
                            }
                          }

                          return (
                            <tr key={n.id} className="bg-white">
                              <td className="px-6 py-4 font-bold text-slate-700 text-sm capitalize">{n.estudanteNome.toLowerCase()}</td>
                              <td className="px-6 py-4 text-center font-black text-slate-900">{displayNota}</td>
                              <td className={`px-6 py-4 text-center text-xs font-black uppercase tracking-widest ${statusColor}`}>{statusText}</td>
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
                  className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all transition-colors"
                >
                  Revisar Dados
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-10 py-3 rounded-2xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-xl shadow-orange-200 transition-all flex items-center space-x-3 active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  <span>Confirmar e Salvar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

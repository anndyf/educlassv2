"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, AlertCircle, CheckCircle2, X } from "lucide-react"

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
  
  // Inicializar estado com notas existentes
  const [notas, setNotas] = useState<Record<string, string>>(() => {
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

  const calcularMediaFinal = (notaOriginal: number, notaRecuperacao: number) => {
    return ((notaOriginal + notaRecuperacao) / 2).toFixed(2)
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
      const notasArray = Object.entries(notas).map(([notaId, notaRecup]) => ({
        notaId,
        notaRecuperacao: parseFloat(notaRecup) || 0
      }))

      const response = await fetch('/api/notas/recuperacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notas: notasArray })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notas de recuperação salvas com sucesso!' })
        // A página será recarregada via router.refresh(), atualizando os dados vindos do servidor
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/notas/recuperacao"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lançar Recuperação</h1>
              <p className="text-sm text-gray-600">{turmaNome}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Mensagem */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{message.text}</span>
              </div>
            </div>
          )}

          {/* Seleção de Disciplina */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <label htmlFor="disciplina" className="block text-sm font-medium text-gray-700 mb-2">Selecione a Disciplina</label>
            <select
              id="disciplina"
              value={disciplinaSelecionada}
              onChange={(e) => setDisciplinaSelecionada(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Escolha uma disciplina...</option>
              {disciplinas.map((disc) => (
                <option key={disc.id} value={disc.id}>{disc.nome}</option>
              ))}
            </select>
          </div>

          {!disciplinaSelecionada ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertCircle className="w-8 h-8 text-gray-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">selecione uma disciplina</h3>
               <p className="text-gray-500 max-w-sm mx-auto">
                 Para visualizar e lançar as notas de recuperação, escolha a disciplina desejada no menu acima.
               </p>
            </div>
          ) : (
            <>
              {/* Tabela de Recuperação */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                   <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-500">Total em Recuperação</p>
                       <p className="text-2xl font-bold text-gray-900">
                         {notasRecuperacao.filter(n => n.disciplinaId === disciplinaSelecionada).length}
                       </p>
                     </div>
                     <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                       R
                     </div>
                   </div>

                   <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-green-700">Alunos Recuperados</p>
                       <p className="text-2xl font-bold text-green-700">
                         {notasRecuperacao.filter(n => n.disciplinaId === disciplinaSelecionada).reduce((acc, curr) => {
                           const val = parseFloat(notas[curr.id] || '0')
                           return (val >= 5 && notas[curr.id] !== '-1') ? acc + 1 : acc
                         }, 0)}
                       </p>
                     </div>
                     <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                       <CheckCircle2 className="w-6 h-6" />
                     </div>
                   </div>

                   <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-purple-700">Irão para Conselho</p>
                       <p className="text-2xl font-bold text-purple-700">
                         {notasRecuperacao.filter(n => n.disciplinaId === disciplinaSelecionada).reduce((acc, curr) => {
                             const val = parseFloat(notas[curr.id])
                             // Considera conselho se tiver nota lançada < 5 OU se não realizou (-1)
                             const temNota = notas[curr.id] !== undefined && notas[curr.id] !== ''
                             if (!temNota) return acc // Não conta pendentes sem digitação
                             const isNaoRealizou = notas[curr.id] === '-1'
                             return (val < 5 || isNaoRealizou) ? acc + 1 : acc
                         }, 0)}
                       </p>
                     </div>
                     <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                       C
                     </div>
                   </div>
                </div>

                <div className="px-6 py-4 bg-white border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    Atenção: A nota original <strong>não será alterada</strong>. Se a nota da recuperação for maior ou igual a 5.0, o estudante será aprovado.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="divide-x divide-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estudante
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Média Anual
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                          Nota Recuperação
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Não Realizou
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                          Novo Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {notasRecuperacao
                        .filter(n => n.disciplinaId === disciplinaSelecionada)
                        .map((nota, index) => {
                        const notaRecup = notas[nota.id] ? parseFloat(notas[nota.id]) : null
                        
                        let novoStatus = ''
                        let statusColor = ''
                        
                        if (notaRecup !== null && !isNaN(notaRecup)) {
                          if (notaRecup === -1) {
                             novoStatus = 'Não Realizou'
                             statusColor = 'text-gray-500'
                          } else if (notaRecup >= 5) {
                            novoStatus = 'Aprovado (Rec)'
                            statusColor = 'text-green-600'
                          } else {
                            novoStatus = 'Conselho de Classe'
                            statusColor = 'text-purple-600'
                          }
                        }

                        const isNaoRealizou = notas[nota.id] === '-1'

                        let rowBg = 'hover:bg-gray-50'
                        if (novoStatus.includes('Aprovado')) {
                          rowBg = 'bg-green-50 hover:bg-green-100'
                        } else if (novoStatus === 'Não Realizou') {
                          rowBg = 'bg-gray-100 hover:bg-gray-200'
                        }

                        return (
                          <tr key={nota.id} className={`${rowBg} divide-x divide-gray-200 transition-colors`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-base font-medium text-gray-900">
                                {nota.estudanteNome}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-bold text-orange-600">
                                {nota.nota.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                value={isNaoRealizou ? '' : (notas[nota.id] || '')}
                                disabled={isNaoRealizou}
                                onChange={(e) => handleNotaChange(nota.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center disabled:bg-gray-100 disabled:text-gray-400"
                                placeholder={isNaoRealizou ? '-' : '0.0'}
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input 
                                type="checkbox"
                                checked={isNaoRealizou}
                                onChange={(e) => toggleNaoRealizou(nota.id, e.target.checked)}
                                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-sm font-semibold ${statusColor}`}>
                                {novoStatus}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !disciplinaSelecionada}
                    className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    <span>{loading ? 'Salvando...' : 'Salvar Recuperações'}</span>
                  </button>
                </div>
              </div>
            </>
          )} 
        </form>

        {/* Modal de Confirmação */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Confirmar Lançamento</h3>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-gray-600 mb-6">
                  Confira abaixo as notas que serão registradas. Os status serão atualizados automaticamente.
                </p>

                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-500 font-medium uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Estudante</th>
                        <th className="px-4 py-3 text-center">Nota Rec.</th>
                        <th className="px-4 py-3 text-center">Novo Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {notasRecuperacao
                        .filter(n => n.disciplinaId === disciplinaSelecionada)
                        .map(n => {
                          const valor = notas[n.id]
                           // Mostrar apenas se tiver valor preenchido (ou se já tiver valor no banco e foi mantido)
                           // Mas aqui 'notas' tem tudo. Vamos mostrar todos da disciplina.
                           // Ou melhor, destacar os que tem valor.
                          
                          if (!valor) return null
                          
                          const notaVal = parseFloat(valor)
                          let statusText = '-'
                          let statusColor = 'text-gray-400'
                          let displayNota = valor

                          if (valor === '-1') {
                            displayNota = 'Não Realizou'
                            statusText = 'Não Realizou'
                            statusColor = 'text-gray-500'
                          } else {
                            if (notaVal >= 5) {
                              statusText = 'Aprovado'
                              statusColor = 'text-green-600 font-bold'
                            } else {
                              statusText = 'Conselho'
                              statusColor = 'text-purple-600 font-bold'
                            }
                          }

                          return (
                            <tr key={n.id} className="bg-white">
                              <td className="px-4 py-3 font-medium text-gray-900">{n.estudanteNome}</td>
                              <td className="px-4 py-3 text-center font-bold text-gray-700">{displayNota}</td>
                              <td className={`px-4 py-3 text-center ${statusColor}`}>{statusText}</td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-5 py-2.5 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
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

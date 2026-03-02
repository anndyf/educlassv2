"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, AlertCircle, Info, UserMinus, X, CheckCircle2 } from "lucide-react"

interface Estudante {
  matricula: string
  nome: string
}

interface Disciplina {
  id: string
  nome: string
}

interface NotaState {
  nota1: string
  nota2: string
  nota3: string
  isDesistente: boolean
  isDesistenteUnid1: boolean
  isDesistenteUnid2: boolean
  isDesistenteUnid3: boolean
}

export default function LancarNotasTurmaClient({
  turmaId,
  turmaNome,
  disciplinas,
  estudantes
}: {
  turmaId: string
  turmaNome: string
  disciplinas: Disciplina[]
  estudantes: Estudante[]
}) {
  const router = useRouter()
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("")
  const [notas, setNotas] = useState<Record<string, NotaState>>({})
  const [originalNotas, setOriginalNotas] = useState<Record<string, NotaState>>({})
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
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

  const handleNotaChange = (estudanteId: string, campo: 'nota1' | 'nota2' | 'nota3', valor: string) => {
    // Validação de 1 casa decimal e limite 10
    if (valor !== '') {
      // Verifica se tem mais de 1 casa decimal
      if (valor.includes('.')) {
        const parts = valor.split('.')
        if (parts[1].length > 1) return // Bloqueia s/ atualizar
      }
      
      const num = parseFloat(valor)
      if (num > 10) return // Bloqueia maior que 10
      if (num < 0) return // Bloqueia menor que 0
    }

    setNotas(prev => ({
      ...prev,
      [estudanteId]: {
        ...(prev[estudanteId] || { nota1: '', nota2: '', nota3: '', isDesistente: false, isDesistenteUnid1: false, isDesistenteUnid2: false, isDesistenteUnid3: false }),
        [campo]: valor
      }
    }))
  }

  const handleDesistenteChange = (estudanteId: string, field: 'isDesistente' | 'isDesistenteUnid1' | 'isDesistenteUnid2' | 'isDesistenteUnid3', checked: boolean) => {
    setNotas(prev => ({
      ...prev,
      [estudanteId]: {
        ...(prev[estudanteId] || { nota1: '', nota2: '', nota3: '', isDesistente: false, isDesistenteUnid1: false, isDesistenteUnid2: false, isDesistenteUnid3: false }),
        [field]: checked
      }
    }))
  }

  const calcularMedia = (estudanteId: string) => {
    const nota = notas[estudanteId]
    if (!nota) return '-'
    if (nota.isDesistente) return 'Desistente'

    const n1 = (nota.isDesistenteUnid1) ? 0 : parseFloat(nota.nota1 || '0')
    const n2 = (nota.isDesistenteUnid2) ? 0 : parseFloat(nota.nota2 || '0')
    const n3 = (nota.isDesistenteUnid3) ? 0 : parseFloat(nota.nota3 || '0')

    const media = (n1 + n2 + n3) / 3
    return media.toFixed(1)
  }

  const getStatusColor = (media: string) => {
    if (media === 'Desistente') return 'text-slate-500'
    if (media === '-') return 'text-slate-400'
    const valor = parseFloat(media)
    if (valor >= 5) return 'text-green-600'
    return 'text-orange-600'
  }

  const getChanges = () => {
    const changes: Array<{ nome: string, alteracoes: string[] }> = []

    estudantes.forEach(estudante => {
      const atual = notas[estudante.matricula]
      const original = originalNotas[estudante.matricula] || { nota1: '', nota2: '', nota3: '', isDesistente: false, isDesistenteUnid1: false, isDesistenteUnid2: false, isDesistenteUnid3: false }
      
      if (!atual) return

      const diffs: string[] = []

      if (atual.nota1 !== original.nota1) diffs.push(`U1: ${original.nota1 || '0'} → ${atual.nota1 || '0'}`)
      if (atual.nota2 !== original.nota2) diffs.push(`U2: ${original.nota2 || '0'} → ${atual.nota2 || '0'}`)
      if (atual.nota3 !== original.nota3) diffs.push(`U3: ${original.nota3 || '0'} → ${atual.nota3 || '0'}`)
      
      if (atual.isDesistente !== original.isDesistente) {
        diffs.push(atual.isDesistente ? 'Marcado como Desistente Geral' : 'Removida Desistência Geral')
      }
      if (atual.isDesistenteUnid1 !== original.isDesistenteUnid1) {
        diffs.push(atual.isDesistenteUnid1 ? 'DES na U1' : 'Nota restaurada na U1')
      }
      if (atual.isDesistenteUnid2 !== original.isDesistenteUnid2) {
        diffs.push(atual.isDesistenteUnid2 ? 'DES na U2' : 'Nota restaurada na U2')
      }
      if (atual.isDesistenteUnid3 !== original.isDesistenteUnid3) {
        diffs.push(atual.isDesistenteUnid3 ? 'DES na U3' : 'Nota restaurada na U3')
      }

      if (diffs.length > 0) {
        changes.push({ nome: estudante.nome, alteracoes: diffs })
      }
    })

    return changes
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!disciplinaSelecionada) {
      setMessage({ type: 'error', text: 'Selecione uma disciplina' })
      return
    }
    
    const changes = getChanges()
    if (changes.length === 0) {
      setMessage({ type: 'error', text: 'Nenhuma alteração detectada para salvar.' })
      return
    }

    setShowModal(true)
  }

  const confirmSave = async () => {
    setLoading(true)
    setMessage(null)
    setShowModal(false)

    try {
      // Filtrar apenas as notas que realmente mudaram
      const changedEntries = Object.entries(notas).filter(([estudanteId, data]) => {
        const original = originalNotas[estudanteId]
        if (!original) return true // Se não tinha nada antes, é novo
        
        return (
          data.nota1 !== original.nota1 ||
          data.nota2 !== original.nota2 ||
          data.nota3 !== original.nota3 ||
          data.isDesistente !== original.isDesistente ||
          data.isDesistenteUnid1 !== original.isDesistenteUnid1 ||
          data.isDesistenteUnid2 !== original.isDesistenteUnid2 ||
          data.isDesistenteUnid3 !== original.isDesistenteUnid3
        )
      })

      if (changedEntries.length === 0) {
        setMessage({ type: 'error', text: 'Nenhuma alteração detectada para salvar.' })
        setLoading(false)
        return
      }

      const notasArray = changedEntries.map(([estudanteId, data]) => ({
        estudanteId,
        disciplinaId: disciplinaSelecionada,
        nota1: data.nota1,
        nota2: data.nota2,
        nota3: data.nota3,
        isDesistente: data.isDesistente,
        isDesistenteUnid1: data.isDesistenteUnid1,
        isDesistenteUnid2: data.isDesistenteUnid2,
        isDesistenteUnid3: data.isDesistenteUnid3
      }))

      const response = await fetch('/api/notas/lancar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notas: notasArray })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notas lançadas com sucesso!' })
        setOriginalNotas(JSON.parse(JSON.stringify(notas))) // Atualiza o estado original após salvar
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

  useEffect(() => {
    if (disciplinaSelecionada) {
      setLoading(true)
      fetch(`/api/notas/turma/${turmaId}/disciplina/${disciplinaSelecionada}`)
        .then(res => res.json())
        .then(data => {
          const notasExistentes: Record<string, NotaState> = {}
          if (Array.isArray(data)) {
            data.forEach((nota: any) => {
              notasExistentes[nota.estudanteId] = {
                nota1: nota.nota1?.toString() || '',
                nota2: nota.nota2?.toString() || '',
                nota3: nota.nota3?.toString() || '',
                isDesistente: nota.status === 'DESISTENTE',
                isDesistenteUnid1: !!nota.isDesistenteUnid1,
                isDesistenteUnid2: !!nota.isDesistenteUnid2,
                isDesistenteUnid3: !!nota.isDesistenteUnid3
              }
            })
          }
          setNotas(notasExistentes)
          setOriginalNotas(JSON.parse(JSON.stringify(notasExistentes)))
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [disciplinaSelecionada, turmaId])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/notas" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {disciplinaSelecionada 
                  ? `${turmaNome} • ${disciplinas.find(d => d.id === disciplinaSelecionada)?.nome}`
                  : `Lançar Notas: ${turmaNome}`}
              </h1>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600/70">Lançamento por Unidade</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Dica de Desistência:</p>
            <p>Use o ícone <UserMinus className="inline w-3 h-3 mx-1"/> em cada unidade para marcar que o aluno desistiu especificamente naquele período.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <label htmlFor="disciplina" className="block text-sm font-medium text-slate-700 mb-2">Selecione a Disciplina</label>
            <select
              id="disciplina"
              value={disciplinaSelecionada}
              onChange={(e) => setDisciplinaSelecionada(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Escolha uma disciplina...</option>
              {disciplinas.map((disc) => (
                <option key={disc.id} value={disc.id}>{disc.nome}</option>
              ))}
            </select>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 boundary-green-200' : 'bg-red-50 text-red-800 border-red-200'} border`}>
              <div className="flex items-center space-x-2"><AlertCircle className="w-5 h-5" /><span>{message.text}</span></div>
            </div>
          )}

          {disciplinaSelecionada && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[200px]">Nome do Estudante</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Unid. 1</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Unid. 2</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Unid. 3</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Média</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Geral</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {estudantes.map((estudante, index) => {
                      const dados = notas[estudante.matricula] || { nota1: '', nota2: '', nota3: '', isDesistente: false, isDesistenteUnid1: false, isDesistenteUnid2: false, isDesistenteUnid3: false }
                      const media = calcularMedia(estudante.matricula)
                      const isDesistente = dados.isDesistente

                      return (
                        <tr key={estudante.matricula} className={`hover:bg-slate-50 transition-colors ${isDesistente ? 'bg-yellow-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${isDesistente ? 'text-amber-700' : 'text-slate-900'}`}>
                              {estudante.nome}
                              {isDesistente && <span className="ml-2 text-xs bg-amber-200 px-1.5 py-0.5 rounded uppercase font-bold text-amber-800">Desistente Geral</span>}
                            </div>
                          </td>
                          {['1', '2', '3'].map((u) => {
                            const isUnidDesistente = (dados as any)[`isDesistenteUnid${u}`];
                            const isDisabled = isDesistente || isUnidDesistente;
                            
                            // Verificar se o valor mudou em relação ao original para destaque visual
                            const valorAtual = (dados as any)[`nota${u}`]
                            const valorOriginal = originalNotas[estudante.matricula]?.[`nota${u}` as keyof NotaState]
                            const foiAlterado = valorAtual !== valorOriginal && valorOriginal !== undefined

                            return (
                              <td key={u} className={`px-4 py-4 text-center transition-colors ${isUnidDesistente ? 'bg-yellow-100/50' : foiAlterado ? 'bg-blue-50/30' : ''}`}>
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="relative">
                                    <input
                                      type={isUnidDesistente ? "text" : "number"}
                                      step="0.1"
                                      min="0"
                                      max="10"
                                      readOnly={isDisabled}
                                      value={isUnidDesistente ? "DES" : valorAtual}
                                      onChange={(e) => handleNotaChange(estudante.matricula, `nota${u}` as any, e.target.value)}
                                      className={`w-16 h-9 px-2 text-center border rounded focus:ring-2 focus:ring-blue-500 transition-all ${
                                        isUnidDesistente 
                                          ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold' 
                                          : isDesistente
                                            ? 'bg-slate-100 border-slate-200 text-slate-400'
                                            : foiAlterado
                                              ? 'border-blue-500 ring-1 ring-blue-500 bg-white font-bold'
                                              : 'border-slate-300 bg-white'
                                      }`}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDesistenteChange(estudante.matricula, `isDesistenteUnid${u}` as any, !isUnidDesistente)}
                                    className={`p-1 rounded transition-colors ${isUnidDesistente ? 'text-amber-600 bg-amber-200' : 'text-slate-300 hover:text-amber-500'}`}
                                    title={isUnidDesistente ? "Remover desistência desta unidade" : "Marcar desistência nesta unidade"}
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )
                          })}
                          <td className="px-4 py-4 text-center">
                            <span className={`text-sm font-bold ${getStatusColor(media)}`}>{media}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isDesistente}
                              onChange={(e) => handleDesistenteChange(estudante.matricula, 'isDesistente', e.target.checked)}
                              className="w-5 h-5 text-amber-600 border-slate-300 rounded cursor-pointer ring-offset-white focus:ring-amber-500"
                              title="Desistente Geral da Disciplina"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  {hasUnsavedChanges() && (
                    <div className="flex items-center gap-2 text-amber-600 animate-pulse">
                      <AlertCircle size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Alterações pendentes para salvar</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Modal de Confirmação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
                Confirmar Alterações
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-slate-600 mb-4 font-medium">
                As seguintes mudanças serão salvas no sistema:
              </p>
              
              <div className="space-y-4">
                {getChanges().map((change, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                      {change.nome}
                    </p>
                    <ul className="space-y-1">
                      {change.alteracoes.map((alt, j) => (
                        <li key={j} className="text-sm text-slate-800 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-2" />
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-white transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Confirmar e Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, TrendingUp } from "lucide-react"

interface RecuperacaoPageClientProps {
  turmas: any[]
  totalAlunosEmRecuperacao: number
}

export default function RecuperacaoPageClient({ turmas, totalAlunosEmRecuperacao }: RecuperacaoPageClientProps) {
  const [filterTurno, setFilterTurno] = useState("")
  const [filterNome, setFilterNome] = useState("")

  // Filtrar turmas
  const filteredTurmas = turmas.filter(t => {
    const matchTurno = filterTurno ? t.turno === filterTurno : true
    const matchNome = filterNome ? t.nome.toLowerCase().includes(filterNome.toLowerCase()) : true
    return matchTurno && matchNome
  })

  // Agrupar turmas filtradas por turno
  const turnosOrder = ['Matutino', 'Vespertino', 'Noturno']
  const turmasPorTurno: Record<string, any[]> = {
    'Matutino': [],
    'Vespertino': [],
    'Noturno': []
  }
  const outros: any[] = []

  filteredTurmas.forEach(t => {
    if (t.turno && turnosOrder.includes(t.turno)) {
      turmasPorTurno[t.turno].push(t)
    } else {
      outros.push(t)
    }
  })

  // Calcular estatísticas com base nos filtrados? 
  // O original calculava com base em TODOS para o banner, então manterei o totalAlunosEmRecuperacao vindo da prop (global)
  // Mas para o filtro de turno, ele usa as turmas disponíveis
  const uniqueTurnos = Array.from(new Set(turmas.map(t => t.turno).filter(Boolean)))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Lançar Recuperação</h1>
              <p className="text-sm text-slate-600">Selecione uma turma para lançar notas de recuperação</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Resumo */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-rose-600 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Painel de Recuperação</h2>
              <p className="text-orange-100 max-w-xl text-sm leading-snug">
                 Visualize turmas com estudantes em recuperação (Média &lt; 5.0).
                 Ao lançar a nota, se o valor for &ge; 5.0, o estudante é aprovado automaticamente.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[100px] text-center">
                <p className="text-orange-100 text-[10px] font-medium uppercase tracking-wider mb-0.5">Turmas Afetadas</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{turmas.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[100px] text-center">
                <p className="text-orange-100 text-[10px] font-medium uppercase tracking-wider mb-0.5">Em Recuperação</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{totalAlunosEmRecuperacao}</p>
              </div>
            </div>
          </div>
          
          {/* Decorative background visual */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end mb-8">
            <div className="flex-1 w-full space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Pesquisar Turma</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        value={filterNome}
                        onChange={(e) => setFilterNome(e.target.value)}
                        placeholder="Nome da turma..."
                        className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="w-full md:w-48 space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Turno</label>
                <select 
                    value={filterTurno}
                    onChange={(e) => setFilterTurno(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-700"
                >
                    <option value="">Todos os Turnos</option>
                    {uniqueTurnos.map((t: any) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>

        {/* Turmas List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Turmas com Estudantes em Recuperação
          </h2>
          
          {filteredTurmas.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">
                Nenhuma turma encontrada.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {[...turnosOrder, 'Outros'].map((turno) => {
                const lista = turno === 'Outros' ? outros : turmasPorTurno[turno]
                if (!lista || lista.length === 0) return null

                return (
                  <div key={turno}>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 px-1 border-l-4 border-orange-500 pl-3">
                      {turno === 'Outros' ? 'Outros Turnos' : turno}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {lista.map((turma) => (
                          <Link
                            key={turma.id}
                            href={`/dashboard/notas/recuperacao/${turma.id}`}
                            className="border border-slate-200 rounded-2xl p-4 hover:border-orange-500 hover:bg-orange-50 transition-all group bg-white shadow-sm hover:shadow-md"
                          >
                            <h3 className="font-bold text-slate-900 mb-3 group-hover:text-orange-700 whitespace-nowrap truncate text-base tracking-tight" title={turma.nome}>
                              {turma.nome}
                            </h3>
                            
                            <div className="space-y-1.5 text-sm text-slate-600">
                              <div className="flex justify-between items-center">
                                <span className="text-xs uppercase font-black text-slate-400">Em Recuperação</span>
                                <span className="font-bold text-orange-600">{turma.totalRecuperacao}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs uppercase font-black text-slate-400">Total Estudantes</span>
                                <span className="font-bold text-slate-900">{turma._count.estudantes}</span>
                              </div>
                            </div>
                          </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

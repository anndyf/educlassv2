"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, Search, BookOpen, Save, History, X } from "lucide-react"
import TeacherTipsModal from "@/components/TeacherTipsModal"

export default function NotasClient({ turmas }: { turmas: any[] }) {
  const [filterTurno, setFilterTurno] = useState("")
  const [filterNome, setFilterNome] = useState("")

  const noteTips = [
    {
      title: "Consolidação e Conselhos",
      description: "É fundamental lançar a média de cada unidade. Isso permite consolidar o resultado final e possibilita a realização dos conselhos de classe ao término de cada período.",
      icon: <FileText className="w-10 h-10 text-emerald-600" />,
      color: "bg-emerald-600"
    },
    {
      title: "Salvamento Flexível",
      description: "Lance as notas conforme seu ritmo. O sistema salva rascunhos automaticamente para que você possa revisar e completar o trabalho mais tarde.",
      icon: <Save className="w-10 h-10 text-blue-600" />,
      color: "bg-blue-600"
    },
    {
      title: "Segurança nos Dados",
      description: "Todas as alterações nas notas são registradas no sistema de auditoria, garantindo transparência e segurança tanto para o professor quanto para a escola.",
      icon: <History className="w-10 h-10 text-amber-600" />,
      color: "bg-amber-600"
    }
  ]

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

  const totalEstudantes = turmas.reduce((acc, t) => acc + t._count.estudantes, 0)
  const uniqueTurnos = Array.from(new Set(turmas.map(t => t.turno).filter(Boolean)))

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherTipsModal 
        storageKey="seen_tips_lancar_notas"
        title="Dicas do Lançador"
        tips={noteTips}
      />
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
              <h1 className="text-2xl font-bold text-slate-900">Lançar Notas</h1>
              <p className="text-sm text-slate-600">Selecione uma turma para lançar as notas finais</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Resumo (Verde) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Painel de Avaliações</h2>
              <p className="text-emerald-100 max-w-xl text-sm">
                Selecione uma turma abaixo para iniciar o lançamento de notas, visualizar relatórios e gerenciar o desempenho acadêmico dos estudantes.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[100px] text-center">
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-0.5">Minhas Turmas</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{turmas.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[100px] text-center">
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-0.5">Total Alunos</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{totalEstudantes}</p>
              </div>
            </div>
          </div>
          
          {/* Decorative background visual */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        </div>

        {/* Filtros Premium */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
          {/* Total Badge */}
          <div className="bg-slate-900 rounded-2xl py-2 px-4 flex items-center gap-3 shrink-0 self-stretch md:self-auto">
            <div className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse" />
            <p className="text-white text-lg font-bold leading-none">{filteredTurmas.length}</p>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative group self-stretch md:self-auto min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-emerald-600 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome da turma..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none font-medium"
              value={filterNome}
              onChange={(e) => setFilterNome(e.target.value)}
            />
          </div>

          {/* Dropdowns & Reset */}
          <div className="flex flex-wrap items-center gap-2 px-2 pb-2 md:pb-0">
            <select 
              value={filterTurno}
              onChange={(e) => setFilterTurno(e.target.value)}
              className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="">Todos os Turnos</option>
              {uniqueTurnos.map((t: any) => <option key={t} value={t}>{t}</option>)}
            </select>

            {(filterNome || filterTurno) && (
              <button 
                onClick={() => { setFilterNome(''); setFilterTurno(''); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all group"
                title="Limpar filtros"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Turmas List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Selecione uma Turma
          </h2>
          
          {filteredTurmas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
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
                    <h3 className="text-lg font-bold text-slate-800 mb-4 px-1 border-l-4 border-emerald-500 pl-3">
                      {turno === 'Outros' ? 'Outros Turnos' : turno}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {lista.map((turma) => (
                        <Link
                          key={turma.id}
                          href={`/dashboard/notas/lancar/${turma.id}`}
                          className="border border-slate-200 rounded-2xl p-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all group bg-white shadow-sm hover:shadow-md h-full flex flex-col justify-between"
                        >
                          <div>
                              <h3 className="font-bold text-slate-900 mb-3 group-hover:text-emerald-700 whitespace-nowrap truncate text-base tracking-tight" title={turma.nome}>
                                {turma.nome}
                              </h3>
                              
                              <div className="space-y-1.5 text-sm text-slate-600">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs uppercase font-black text-slate-400">Estudantes</span>
                                  <span className="font-bold text-slate-900">{turma._count.estudantes}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs uppercase font-black text-slate-400">Disciplinas</span>
                                  <span className="font-bold text-slate-900">{turma._count.disciplinas}</span>
                                </div>
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

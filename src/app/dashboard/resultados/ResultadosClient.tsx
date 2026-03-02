"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Users, Search, Filter, Info, ListFilter, CheckCircle2 } from "lucide-react"
import TeacherTipsModal from "@/components/TeacherTipsModal"

export default function ResultadosClient({ turmas }: { turmas: any[] }) {
  // Dicas do Professor
  const resultTips = [
    {
      title: "Filtros Poderosos",
      description: "Use os filtros no topo para encontrar rapidamente turmas por Curso, Turno ou Nome.",
      icon: <Filter className="w-10 h-10 text-blue-600" />,
      color: "bg-blue-600"
    },
    {
      title: "Resultados Detalhados",
      description: "Clique em qualquer cartão de turma para ver a matriz completa de notas, status e predição de risco.",
      icon: <ListFilter className="w-10 h-10 text-indigo-600" />,
      color: "bg-indigo-600"
    },
    {
      title: "Busca Rápida",
      description: "A barra de pesquisa filtra em tempo real as turmas pelo nome, facilitando a localização.",
      icon: <Search className="w-10 h-10 text-emerald-600" />,
      color: "bg-emerald-600"
    }
  ]
  // Filtros
  const [filterCurso, setFilterCurso] = useState("")
  const [filterTurno, setFilterTurno] = useState("")
  const [filterNome, setFilterNome] = useState("")

  // Deriva opções únicas
  const uniqueCursos = useMemo(() => Array.from(new Set(turmas.map(t => t.curso).filter(Boolean))), [turmas])
  const uniqueTurnos = useMemo(() => Array.from(new Set(turmas.map(t => t.turno).filter(Boolean))), [turmas])

  // Lógica de filtragem
  const filteredTurmas = useMemo(() => {
    return turmas.filter(t => {
      const matchCurso = filterCurso ? t.curso === filterCurso : true
      const matchTurno = filterTurno ? t.turno === filterTurno : true
      const matchNome = filterNome ? t.nome.toLowerCase().includes(filterNome.toLowerCase()) : true
      return matchCurso && matchTurno && matchNome
    })
  }, [turmas, filterCurso, filterTurno, filterNome])

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherTipsModal 
        storageKey="seen_tips_resultados_index" 
        title="Bem-vindo aos Resultados" 
        tips={resultTips.map(tip => ({
            ...tip,
            icon: tip.icon // Ensure icon is passed correctly as ReactNode
        }))} 
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
              <h1 className="text-2xl font-bold text-slate-900">Resultados da Turma</h1>
              <p className="text-sm text-slate-600">Visualizar desempenho por unidade e resultados finais</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dicas Fixas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {resultTips.map((tip, index) => (
             <div key={index} className="bg-white/60 border border-slate-200/60 p-4 rounded-2xl flex items-start space-x-4 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                <div className={`p-2.5 rounded-xl ${tip.color.replace('bg-', 'bg-opacity-10 text-').replace('text-white', '')} ${tip.color.replace('bg-', 'bg-').replace('600', '50')}`}>
                   {/* Clone icon to adjust size/color if needed, but using direct render for now */}
                   <div className={`${tip.color.replace('bg-', 'text-')} w-6 h-6 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5`}>
                     {tip.icon}
                   </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{tip.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{tip.description}</p>
                </div>
             </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end mb-8">
            <div className="flex-1 min-w-[200px] space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Curso</label>
                <select 
                    value={filterCurso}
                    onChange={(e) => setFilterCurso(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                >
                    <option value="">Todos os Cursos</option>
                    {uniqueCursos.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="flex-1 min-w-[200px] space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Turno</label>
                <select 
                    value={filterTurno}
                    onChange={(e) => setFilterTurno(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                >
                    <option value="">Todos os Turnos</option>
                    {uniqueTurnos.map((t: any) => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="flex-[2] min-w-[250px] space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Pesquisar Turma</label>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        value={filterNome}
                        onChange={(e) => setFilterNome(e.target.value)}
                        placeholder="Ex: 1º Ano, Técnico em Enfermagem..."
                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="pb-2.5">
                <span className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                    {filteredTurmas.length} turmas
                </span>
            </div>
        </div>

        {/* Turmas List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Selecione uma Turma
          </h2>
          
          {filteredTurmas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-medium mb-1">Nenhuma turma encontrada</h3>
              <p className="text-slate-500 text-sm">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTurmas.map((turma) => (
                <Link
                  key={turma.id}
                  href={`/dashboard/resultados/${turma.id}`}
                  className="border border-slate-200 rounded-2xl p-4 hover:border-blue-500 hover:bg-blue-50 transition-all group bg-white shadow-sm hover:shadow-md h-full flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3 group-hover:text-blue-700 whitespace-nowrap truncate text-base tracking-tight" title={turma.nome}>
                      {turma.nome}
                    </h3>
                    
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-xs uppercase font-black text-slate-400 truncate max-w-[60%]">{turma.curso || 'Ensino Médio'}</span>
                        {turma.turno && (
                          <span className="bg-slate-100/50 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200/50 uppercase tracking-tighter">
                              {turma.turno}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-100">
                        <span className="text-xs uppercase font-black text-slate-400">Estudantes</span>
                        <span className="font-bold text-slate-900">{turma._count.estudantes}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

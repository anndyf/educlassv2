"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Users, FileText, Pencil, Search, Filter } from "lucide-react"
import { decodeTurma, getTurmaColor, getTurmaIcon } from "@/lib/turma-utils"

interface Turma {
  id: string
  nome: string
  curso: string | null
  turno: string | null
  modalidade: string | null
  _count: {
    estudantes: number
    disciplinas: number
  }
}

interface TurmasListClientProps {
  turmas: Turma[]
}

export default function TurmasListClient({ 
  turmas
}: TurmasListClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCurso, setSelectedCurso] = useState<string | null>(null)
  const [selectedTurno, setSelectedTurno] = useState<string | null>(null)
  const [selectedSerie, setSelectedSerie] = useState<string | null>(null)

  // Extrair estatísticas e opções únicas
  const cursosOptions = useMemo(() => {
    const set = new Set<string>()
    turmas.forEach(t => {
      const decoded = decodeTurma(t.nome)
      set.add(t.curso || decoded.curso || "Outros")
    })
    return Array.from(set).sort()
  }, [turmas])

  const turnosOptions = ["Matutino", "Vespertino", "Noturno", "Integral", "Outros"]
  
  const seriesOptions = useMemo(() => {
    const set = new Set<string>()
    turmas.forEach(t => {
      const match = t.nome.match(/^(\d+)/)
      if (match) set.add(match[1])
    })
    return Array.from(set).sort()
  }, [turmas])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCurso(null)
    setSelectedTurno(null)
    setSelectedSerie(null)
  }

  // Filtrar turmas
  const filteredTurmas = useMemo(() => {
    return turmas.filter(t => {
      const decoded = decodeTurma(t.nome)
      const nomeCurso = t.curso || decoded.curso || "Outros"
      const turno = t.turno || decoded.turno || "Outros"
      const serieMatch = t.nome.match(/^(\d+)/)
      const serie = serieMatch ? serieMatch[1] : null

      const matchesSearch = t.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           nomeCurso.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCurso = !selectedCurso || nomeCurso === selectedCurso
      const matchesTurno = !selectedTurno || turno === selectedTurno
      const matchesSerie = !selectedSerie || serie === selectedSerie

      return matchesSearch && matchesCurso && matchesTurno && matchesSerie
    })
  }, [turmas, searchTerm, selectedCurso, selectedTurno, selectedSerie])

  // Agrupar filtradas por turno
  const turmasAgrupadas = useMemo(() => {
    return filteredTurmas.reduce((acc, turma) => {
      const decoded = decodeTurma(turma.nome)
      const turno = turma.turno || decoded.turno || "Outros"
      if (!acc[turno]) acc[turno] = []
      acc[turno].push(turma)
      return acc
    }, {} as Record<string, Turma[]>)
  }, [filteredTurmas])

  const turnosOrdenados = ["Matutino", "Vespertino", "Noturno", "Integral", "Outros"].filter(t => turmasAgrupadas[t])

  return (
    <div className="space-y-4">
      {/* Top Row: Total Card + Search Input */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        {/* Total Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl py-2 px-4 flex items-center space-x-3 shadow-md shadow-blue-200/50 min-w-[180px]">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-white">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-tight">Total Encontrado</p>
            <p className="text-xl font-bold leading-none">{filteredTurmas.length}</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input 
            type="text"
            placeholder="Buscar turma por nome ou curso..."
            className="w-full h-full py-2.5 pl-11 pr-4 bg-white border border-slate-100 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bottom Row: Minimalist Multi-Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-1.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 md:gap-5 px-3 py-1">
          {/* Cursos */}
          <div className="flex-1 min-w-[120px]">
            <select 
              value={selectedCurso || ""}
              onChange={(e) => setSelectedCurso(e.target.value || null)}
              className="w-full bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 p-0 cursor-pointer appearance-none pr-4"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
            >
              <option value="">Cursos</option>
              {cursosOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="h-3 w-px bg-slate-100 hidden md:block" />

          {/* Turnos */}
          <div className="flex-1 min-w-[120px]">
            <select 
              value={selectedTurno || ""}
              onChange={(e) => setSelectedTurno(e.target.value || null)}
              className="w-full bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 p-0 cursor-pointer appearance-none pr-4"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
            >
              <option value="">Turnos</option>
              {turnosOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="h-3 w-px bg-slate-100 hidden md:block" />

          {/* Séries */}
          <div className="flex-1 min-w-[100px]">
            <select 
              value={selectedSerie || ""}
              onChange={(e) => setSelectedSerie(e.target.value || null)}
              className="w-full bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 p-0 cursor-pointer appearance-none pr-4"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
            >
              <option value="">Séries</option>
              {seriesOptions.map(s => <option key={s} value={s}>{s}ª Série</option>)}
            </select>
          </div>

          {/* Limpar */}
          <button 
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-all border border-slate-100 group"
          >
            <Filter className="w-3 h-3 group-hover:rotate-12 transition-transform opacity-60" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Limpar</span>
          </button>
        </div>
      </div>

      {/* Lista */}
      {turnosOrdenados.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
           <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhuma turma encontrada com esses filtros</p>
        </div>
      ) : (
        <div className="space-y-12">
          {turnosOrdenados.map(turno => (
            <div key={turno} className="space-y-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-sm font-medium text-black uppercase tracking-widest bg-white px-4 py-1 rounded-full shadow-sm border border-slate-100">
                  {turno}
                </h2>
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                  {turmasAgrupadas[turno].length} {turmasAgrupadas[turno].length === 1 ? 'Turma' : 'Turmas'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {turmasAgrupadas[turno].map((turma) => {
                  const decoded = decodeTurma(turma.nome)
                  const cursoExibicao = turma.curso || decoded.curso || "---"
                  const colors = getTurmaColor(cursoExibicao)
                  const Icon = getTurmaIcon(cursoExibicao)
                  
                  return (
                    <div
                      key={turma.id}
                      className="bg-white rounded-[1.25rem] shadow-lg shadow-slate-200/40 border border-slate-100 p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className={`w-11 h-11 ${colors.bg} rounded-xl flex items-center justify-center shrink-0 shadow-md ${colors.shadow}`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-black text-black uppercase tracking-tight leading-none whitespace-nowrap truncate">
                              {turma.nome}
                            </h3>
                            <p className="text-[11px] text-black/40 font-bold uppercase tracking-wide mt-1 whitespace-nowrap truncate">
                              {cursoExibicao}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-0.5 shrink-0 ml-1">
                           <Link
                              href={`/dashboard/turmas/${turma.id}/relatorio`}
                              title="Relatório Geral"
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                           >
                             <FileText className="w-3.5 h-3.5" />
                           </Link>
                           <Link
                              href={`/dashboard/turmas/${turma.id}/status`}
                              title="Matriz de Desempenho"
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                           >
                             <Users className="w-3.5 h-3.5" />
                           </Link>
                           <Link
                              href={`/dashboard/turmas/${turma.id}/editar`}
                              title="Editar Turma"
                              className="p-1 text-slate-400 hover:bg-slate-100 hover:text-black rounded-lg transition-all"
                           >
                             <Pencil className="w-3.5 h-3.5" />
                           </Link>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                           {turma.modalidade && (
                             <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[10px] rounded font-black uppercase tracking-widest border border-slate-100">
                               {turma.modalidade}
                             </span>
                           )}
                        </div>
                        <div className="flex items-center space-x-3">
                           <div className="flex items-center text-[10px] font-bold text-black/60">
                             <Users className="w-3 h-3 mr-1 text-slate-300" />
                             {turma._count.estudantes}
                           </div>
                           <div className="flex items-center text-[10px] font-bold text-black/60">
                             <FileText className="w-3 h-3 mr-1 text-slate-300" />
                             {turma._count.disciplinas}
                           </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

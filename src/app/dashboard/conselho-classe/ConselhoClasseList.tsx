"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Search, Filter, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react"

interface TurmaProcessada {
  id: string
  nome: string
  curso: string
  turno: string
  totalAlunosPendentes: number
  totalAlunosResolvidos: number
  isResolvido: boolean
}

export default function ConselhoClasseList({ 
  gruposIniciais 
}: { 
  gruposIniciais: Record<string, Record<string, TurmaProcessada[]>> 
}) {
  const [search, setSearch] = useState("")

  // Filtrar grupos baseado na busca
  const turnos = Object.keys(gruposIniciais).sort()
  
  const getTurnoColor = (turno: string) => {
    const t = turno.toUpperCase()
    if (t.includes('MATUTINO')) return 'text-orange-600 bg-orange-50'
    if (t.includes('VESPERTINO')) return 'text-blue-600 bg-blue-50'
    if (t.includes('NOTURNO')) return 'text-indigo-600 bg-indigo-50'
    return 'text-slate-600 bg-slate-50'
  }

  return (
    <div className="space-y-8">
      {/* Barra de Busca e Filtros */}
      <div className="sticky top-4 z-20 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100/50 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por turma ou curso..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-pink-100 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center">
              <span className="text-[10px] font-bold text-pink-600">P</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-600">C</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visualização Inteligente ativa</span>
        </div>
      </div>

      {turnos.map(turno => {
        const cursosNoTurno = Object.keys(gruposIniciais[turno]).sort()
        const hasVisibleTurmasNoTurno = cursosNoTurno.some(curso => 
          gruposIniciais[turno][curso].some(t => 
            t.nome.toLowerCase().includes(search.toLowerCase()) || 
            t.curso.toLowerCase().includes(search.toLowerCase())
          )
        )

        if (!hasVisibleTurmasNoTurno && search) return null

        return (
          <section key={turno} className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className={`px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm ${getTurnoColor(turno)}`}>
                {turno.toUpperCase()}
              </div>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-10">
              {cursosNoTurno.map(curso => {
                const turmasFiltradas = gruposIniciais[turno][curso].filter(t => 
                  t.nome.toLowerCase().includes(search.toLowerCase()) || 
                  t.curso.toLowerCase().includes(search.toLowerCase())
                )

                if (turmasFiltradas.length === 0) return null

                return (
                  <div key={curso} className="space-y-4">
                    <div className="flex items-center space-x-2 ml-1">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {curso}
                      </h3>
                      <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                        {turmasFiltradas.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {turmasFiltradas.map((turma) => (
                        <Link
                          key={turma.id}
                          href={`/dashboard/conselho-classe/${turma.id}`}
                          className={`group flex items-center p-3 rounded-2xl border transition-all active:scale-[0.98] bg-white hover:shadow-xl ${
                            turma.isResolvido 
                            ? 'border-emerald-100/50 hover:border-emerald-300' 
                            : 'border-slate-100 hover:border-pink-300'
                          }`}
                        >
                          {/* Barra de Status Lateral */}
                          <div className={`w-1 h-8 rounded-full shrink-0 mr-3 ${
                            turma.isResolvido ? 'bg-emerald-400' : 'bg-pink-500'
                          }`} />

                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold uppercase truncate text-sm tracking-tight transition-colors ${
                              turma.isResolvido ? 'text-emerald-900' : 'text-slate-900 group-hover:text-pink-700'
                            }`} title={turma.nome}>
                              {turma.nome}
                            </h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate leading-tight mt-0.5">
                              {turma.curso}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3 ml-2">
                            <div className="text-right shrink-0">
                              <span className={`block text-[8px] font-bold uppercase tracking-tighter leading-none ${
                                turma.isResolvido ? 'text-emerald-400' : 'text-slate-400'
                              }`}>
                                {turma.isResolvido ? 'Final' : 'Recup.'}
                              </span>
                              <span className={`text-base font-black tabular-nums tracking-tighter ${
                                turma.isResolvido ? 'text-emerald-600' : 'text-pink-600'
                              }`}>
                                {turma.isResolvido ? turma.totalAlunosResolvidos : turma.totalAlunosPendentes}
                              </span>
                            </div>
                            
                            {turma.isResolvido ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

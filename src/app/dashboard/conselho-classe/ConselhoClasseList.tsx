"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react"

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

  const turnos = Object.keys(gruposIniciais).sort()
  
  const getTurnoColor = (turno: string) => {
    const t = turno.toUpperCase()
    if (t.includes('MATUTINO')) return 'border-orange-500'
    if (t.includes('VESPERTINO')) return 'border-blue-500'
    if (t.includes('NOTURNO')) return 'border-indigo-500'
    return 'border-slate-500'
  }

  return (
    <div className="space-y-8">
      {/* Filtros - Estilo Recuperação */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Localizar Turma ou Curso</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 h-[45px]">
          <div className="flex -space-x-1">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" title="Pendências" />
            <div className="w-2 h-2 rounded-full bg-emerald-500" title="Finalizados" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monitoramento Ativo</span>
        </div>
      </div>

      {turnos.map(turno => {
        const cursosNoTurno = Object.keys(gruposIniciais[turno]).sort()
        const hasVisibleTurmasNoTurno = cursosNoTurno.some(curso => 
          gruposIniciais[turno][curso].some(t => 
            t.nome.toLowerCase().includes(search.toLowerCase()) || 
            t.curso.toLowerCase().includes(search.toLowerCase()) ||
            t.turno.toLowerCase().includes(search.toLowerCase())
          )
        )

        if (!hasVisibleTurmasNoTurno && search) return null

        return (
          <div key={turno} className="space-y-10">
            <h3 className={`text-lg font-bold text-slate-800 border-l-4 ${getTurnoColor(turno)} pl-3`}>
              {turno.toUpperCase()}
            </h3>

            <div className="space-y-12">
              {cursosNoTurno.map(curso => {
                const turmasFiltradas = gruposIniciais[turno][curso].filter(t => 
                  t.nome.toLowerCase().includes(search.toLowerCase()) || 
                  t.curso.toLowerCase().includes(search.toLowerCase()) ||
                  t.turno.toLowerCase().includes(search.toLowerCase())
                )

                if (turmasFiltradas.length === 0) return null

                return (
                  <div key={curso} className="space-y-4">
                    <div className="flex items-center space-x-2 ml-1">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {curso}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {turmasFiltradas.map((turma) => (
                        <Link
                          key={turma.id}
                          href={`/dashboard/conselho-classe/${turma.id}`}
                          className={`flex flex-col p-4 rounded-2xl border transition-all bg-white shadow-sm hover:shadow-md ${
                            turma.isResolvido 
                            ? 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30' 
                            : 'border-slate-200 hover:border-orange-500 hover:bg-orange-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h5 className={`font-bold text-base truncate pr-2 ${
                              turma.isResolvido ? 'text-emerald-900' : 'text-slate-900'
                            }`} title={turma.nome}>
                              {turma.nome}
                            </h5>
                            {turma.isResolvido ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0 mt-1.5" />
                            )}
                          </div>
                          
                          <div className="space-y-2 mt-auto">
                            <div className="flex justify-between items-center text-xs">
                              <span className="uppercase font-bold text-slate-400">Situação</span>
                              <span className={`font-bold px-2 py-0.5 rounded-md ${
                                turma.isResolvido 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-pink-100 text-pink-700'
                              }`}>
                                {turma.isResolvido ? 'Finalizado' : 'Pendente'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-xs uppercase font-bold text-slate-400">
                                {turma.isResolvido ? 'Total Resolvidos' : 'Alunos Pendentes'}
                              </span>
                              <span className={`font-bold ${
                                turma.isResolvido ? 'text-emerald-600' : 'text-pink-600'
                              }`}>
                                {turma.isResolvido ? turma.totalAlunosResolvidos : turma.totalAlunosPendentes}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

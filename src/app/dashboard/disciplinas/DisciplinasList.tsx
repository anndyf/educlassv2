"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, ChevronDown, ChevronRight, Sun, Sunset, Moon, Clock, Pencil } from "lucide-react"

interface Disciplina {
  id: string
  nome: string
  turma: {
    id: string
    nome: string
    turno: string | null
  }
  _count: {
    notas: number
  }
}

interface DisciplinasListProps {
  disciplinas: Disciplina[]
}

export default function DisciplinasList({ disciplinas }: DisciplinasListProps) {
  const [openTurmas, setOpenTurmas] = useState<string[]>([])

  const toggleTurma = (turmaId: string) => {
    setOpenTurmas(prev => 
      prev.includes(turmaId) 
        ? prev.filter(id => id !== turmaId)
        : [...prev, turmaId]
    )
  }

  // Agrupar por Turno e depois por Turma
  const porTurno: Record<string, Record<string, { turma: any, disciplinas: Disciplina[] }>> = {}

  disciplinas.forEach(disc => {
    const turno = disc.turma.turno || 'Indefinido'
    const turmaId = disc.turma.id

    if (!porTurno[turno]) {
      porTurno[turno] = {}
    }

    if (!porTurno[turno][turmaId]) {
      porTurno[turno][turmaId] = {
        turma: disc.turma,
        disciplinas: []
      }
    }

    porTurno[turno][turmaId].disciplinas.push(disc)
  })

  // Ordem dos turnos
  const ordemTurnos = ['Matutino', 'Vespertino', 'Noturno', 'Integral', 'Indefinido']
  const sortedTurnos = Object.keys(porTurno).sort((a, b) => {
    return ordemTurnos.indexOf(a) - ordemTurnos.indexOf(b)
  })

  // Icones por turno
  const getTurnoIcon = (turno: string) => {
    switch(turno.toLowerCase()) {
      case 'matutino': return <Sun className="w-5 h-5 text-orange-500" />
      case 'vespertino': return <Sunset className="w-5 h-5 text-orange-600" />
      case 'noturno': return <Moon className="w-5 h-5 text-blue-600" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  // Cores por turno
  const getTurnoColor = (turno: string) => {
    switch(turno.toLowerCase()) {
      case 'matutino': return 'bg-orange-50 border-orange-200 text-orange-900'
      case 'vespertino': return 'bg-amber-50 border-amber-200 text-amber-900'
      case 'noturno': return 'bg-blue-50 border-blue-200 text-blue-900'
      default: return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  return (
    <div className="space-y-8">
      {sortedTurnos.map(turno => (
        <div key={turno} className="space-y-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border w-fit ${getTurnoColor(turno)}`}>
            {getTurnoIcon(turno)}
            <h2 className="font-bold text-lg">{turno}</h2>
          </div>

          <div className="grid gap-4">
            {Object.values(porTurno[turno])
            .sort((a, b) => a.turma.nome.localeCompare(b.turma.nome))
            .map(({ turma, disciplinas: discs }) => {
              const isOpen = openTurmas.includes(turma.id)

              return (
                <div key={turma.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200">
                  <button 
                    onClick={() => toggleTurma(turma.id)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{turma.nome}</h3>
                        <p className="text-sm text-gray-500">{discs.length} disciplinas</p>
                      </div>
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="p-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {discs.map((disciplina) => (
                          <Link
                            key={disciplina.id}
                            href={`/dashboard/disciplinas/${disciplina.id}/editar`}
                            className="group block bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-purple-50 group-hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 truncate" title={disciplina.nome}>
                                  {disciplina.nome}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {disciplina._count.notas} notas
                                </p>
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400">
                                <Pencil className="w-4 h-4" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

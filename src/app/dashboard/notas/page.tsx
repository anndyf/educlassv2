import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Award, TrendingUp, FileText } from "lucide-react"

import { getTurmasPermitidas } from "@/lib/data-fetching"

export const runtime = 'nodejs'

export default async function LancarNotasPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const turmas = await getTurmasPermitidas(session)

  // Agrupar turmas por turno
  const turnosOrder = ['Matutino', 'Vespertino', 'Noturno']
  const turmasPorTurno: Record<string, typeof turmas> = {
    'Matutino': [],
    'Vespertino': [],
    'Noturno': []
  }
  const outros: typeof turmas = []

  turmas.forEach(t => {
    if (t.turno && turnosOrder.includes(t.turno)) {
      turmasPorTurno[t.turno].push(t)
    } else {
      outros.push(t)
    }
  })

  // Calcular estatísticas
  const totalEstudantes = turmas.reduce((acc, t) => acc + t._count.estudantes, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lançar Notas</h1>
              <p className="text-sm text-gray-600">Selecione uma turma para lançar as notas finais</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Resumo */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Painel de Avaliações</h2>
              <p className="text-blue-100 max-w-xl text-sm">
                Selecione uma turma abaixo para iniciar o lançamento de notas, visualizar relatórios e gerenciar o desempenho acadêmico dos estudantes.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[100px] text-center">
                <p className="text-blue-100 text-[10px] font-medium uppercase tracking-wider mb-0.5">Minhas Turmas</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{turmas.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[100px] text-center">
                <p className="text-blue-100 text-[10px] font-medium uppercase tracking-wider mb-0.5">Total Alunos</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{totalEstudantes}</p>
              </div>
            </div>
          </div>
          
          {/* Decorative background visual */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        </div>

        {/* Turmas List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Selecione uma Turma
          </h2>
          
          {turmas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nenhuma turma cadastrada. Cadastre turmas primeiro.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {[...turnosOrder, 'Outros'].map((turno) => {
                const lista = turno === 'Outros' ? outros : turmasPorTurno[turno]
                if (!lista || lista.length === 0) return null

                return (
                  <div key={turno}>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 px-1 border-l-4 border-blue-500 pl-3">
                      {turno === 'Outros' ? 'Outros Turnos' : turno}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {lista.map((turma) => (
                        <Link
                          key={turma.id}
                          href={`/dashboard/notas/lancar/${turma.id}`}
                          className="border border-gray-200 rounded-2xl p-4 hover:border-blue-500 hover:bg-blue-50 transition-all group bg-white shadow-sm hover:shadow-md"
                        >
                          <h3 className="font-bold text-gray-900 mb-3 group-hover:text-blue-700 whitespace-nowrap truncate text-base tracking-tight" title={turma.nome}>
                            {turma.nome}
                          </h3>
                          
                          <div className="space-y-1.5 text-sm text-gray-600">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-black text-gray-400">Estudantes</span>
                              <span className="font-bold text-gray-900">{turma._count.estudantes}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-black text-gray-400">Disciplinas</span>
                              <span className="font-bold text-gray-900">{turma._count.disciplinas}</span>
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

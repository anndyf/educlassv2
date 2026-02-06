import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"

export const runtime = 'nodejs'

import { getTurmasPermitidas } from "@/lib/data-fetching"
import { Session } from "next-auth"

async function getTurmasResultados(session: Session) {
  // Buscar apenas as turmas que o usuário tem permissão
  const turmasPermitidas = await getTurmasPermitidas(session)
  const turmasIds = turmasPermitidas.map(t => t.id)

  const turmas = await prisma.turma.findMany({
    where: {
      id: { in: turmasIds }
    },
    include: {
      _count: {
        select: {
          estudantes: true,
          disciplinas: true
        }
      }
    },
    orderBy: {
      nome: 'asc'
    }
  })

  return turmas
}

export default async function ResultadosPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Apenas Direção e TI podem ver resultados
  if (!session.user.isSuperuser && !session.user.isDirecao) {
    redirect("/dashboard")
  }

  const turmas = await getTurmasResultados(session)

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
              <h1 className="text-2xl font-bold text-gray-900">Resultados da Turma</h1>
              <p className="text-sm text-gray-600">Visualizar desempenho por unidade e resultados finais</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Consulta de Resultados
              </h3>
              <p className="text-blue-800 text-sm mb-2">
                Selecione uma turma para visualizar as notas de todas as unidades, médias parciais e situação final dos estudantes.
              </p>
            </div>
          </div>
        </div>

        {/* Turmas List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Selecione uma Turma
          </h2>
          
          {turmas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nenhuma turma encontrada
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turmas.map((turma) => (
                <Link
                  key={turma.id}
                  href={`/dashboard/resultados/${turma.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <h3 className="font-semibold text-gray-900 mb-3 group-hover:text-blue-700">
                    {turma.nome}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total de Estudantes:</span>
                      <span className="font-medium">{turma._count.estudantes}</span>
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

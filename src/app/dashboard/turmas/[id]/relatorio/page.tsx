import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Download, FileText } from "lucide-react"

export const runtime = 'nodejs'

async function getTurmaRelatorio(id: string) {
  return await prisma.turma.findUnique({
    where: { id },
    include: {
      estudantes: {
        include: {
          notas: {
            include: {
              disciplina: true
            }
          }
        },
        orderBy: {
          nome: 'asc'
        }
      },
      disciplinas: {
        orderBy: {
          nome: 'asc'
        }
      }
    }
  })
}

export default async function RelatorioTurmaPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const turma = await getTurmaRelatorio(id)

  if (!turma) {
    redirect("/dashboard/turmas")
  }

  // Calcular estatísticas
  const totalEstudantes = turma.estudantes.length
  const totalDisciplinas = turma.disciplinas.length
  
  let totalAprovados = 0
  let totalRecuperacao = 0
  let totalDesistentes = 0

  turma.estudantes.forEach((estudante: any) => {
    const aprovadas = estudante.notas.filter((n: any) => n.status === 'APROVADO').length
    const recuperacao = estudante.notas.filter((n: any) => n.status === 'RECUPERACAO').length
    const desistente = estudante.notas.filter((n: any) => n.status === 'DESISTENTE').length

    if (desistente > 0) {
      totalDesistentes++
    } else if (recuperacao > 0) {
      totalRecuperacao++
    } else if (aprovadas === totalDisciplinas) {
      totalAprovados++
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/turmas"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Relatório da Turma</h1>
                <p className="text-sm text-gray-600">{turma.nome}</p>
              </div>
            </div>
            <a
              href={`/api/relatorio/turma/${turma.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Baixar PDF</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <p className="text-sm text-blue-700 mb-1">Total de Estudantes</p>
            <p className="text-3xl font-bold text-blue-900">{totalEstudantes}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-sm text-green-700 mb-1">Aprovados</p>
            <p className="text-3xl font-bold text-green-900">{totalAprovados}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <p className="text-sm text-orange-700 mb-1">Em Recuperação</p>
            <p className="text-3xl font-bold text-orange-900">{totalRecuperacao}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-700 mb-1">Desistentes</p>
            <p className="text-3xl font-bold text-gray-900">{totalDesistentes}</p>
          </div>
        </div>

        {/* Lista de Estudantes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Estudantes e Desempenho</h3>
          </div>

          {turma.estudantes.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum estudante cadastrado nesta turma</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudante
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas Lançadas
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Média
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aprovado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recuperação
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {turma.estudantes.map((estudante: any) => {
                    const aprovadas = estudante.notas.filter((n: any) => n.status === 'APROVADO').length
                    const recuperacao = estudante.notas.filter((n: any) => n.status === 'RECUPERACAO').length
                    const desistente = estudante.notas.some((n: any) => n.status === 'DESISTENTE')
                    const media = estudante.notas.length > 0
                      ? (estudante.notas.reduce((acc: number, n: any) => acc + n.nota, 0) / estudante.notas.length).toFixed(2)
                      : '0.00'

                    let statusText = 'Pendente'
                    let statusColor = 'text-gray-700 bg-gray-100'

                    if (desistente) {
                      statusText = 'Desistente'
                      statusColor = 'text-gray-700 bg-gray-100'
                    } else if (recuperacao > 0) {
                      statusText = 'Recuperação'
                      statusColor = 'text-orange-700 bg-orange-100'
                    } else if (aprovadas === totalDisciplinas && totalDisciplinas > 0) {
                      statusText = 'Aprovado'
                      statusColor = 'text-green-700 bg-green-100'
                    }

                    return (
                      <tr key={estudante.matricula} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {estudante.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {estudante.nome}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">
                          {estudante.notas.length}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-900">{media}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-green-700">{aprovadas}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-orange-700">{recuperacao}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

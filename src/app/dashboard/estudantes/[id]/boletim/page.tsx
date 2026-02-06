import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Download, FileText } from "lucide-react"

export const runtime = 'nodejs'

async function getEstudanteBoletim(id: string) {
  return await prisma.estudante.findUnique({
    where: { id },
    include: {
      turma: true,
      notas: {
        include: {
          disciplina: true
        },
        orderBy: {
          disciplina: {
            nome: 'asc'
          }
        }
      }
    }
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'APROVADO':
      return 'text-green-700 bg-green-100'
    case 'RECUPERACAO':
      return 'text-orange-700 bg-orange-100'
    case 'DESISTENTE':
      return 'text-gray-700 bg-gray-100'
    default:
      return 'text-gray-700 bg-gray-100'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'APROVADO':
      return 'Aprovado'
    case 'RECUPERACAO':
      return 'Recuperação'
    case 'DESISTENTE':
      return 'Desistente'
    default:
      return status
  }
}

export default async function BoletimPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const estudante = await getEstudanteBoletim(id)

  if (!estudante) {
    redirect("/dashboard/estudantes")
  }

  const aprovadas = estudante.notas.filter(n => n.status === 'APROVADO').length
  const recuperacao = estudante.notas.filter(n => n.status === 'RECUPERACAO').length
  const media = estudante.notas.length > 0
    ? (estudante.notas.reduce((acc, n) => acc + n.nota, 0) / estudante.notas.length).toFixed(2)
    : '0.00'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/estudantes"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Boletim</h1>
                <p className="text-sm text-gray-600">{estudante.nome}</p>
              </div>
            </div>
            <a
              href={`/api/boletim/${estudante.id}/pdf`}
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações do Estudante */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {estudante.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{estudante.nome}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Turma</p>
                  <p className="font-semibold text-gray-900">{estudante.turma.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Média Geral</p>
                  <p className="font-semibold text-gray-900">{media}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Disciplinas</p>
                  <p className="font-semibold text-gray-900">{estudante.notas.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-sm text-green-700 mb-1">Aprovado</p>
            <p className="text-3xl font-bold text-green-900">{aprovadas}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <p className="text-sm text-orange-700 mb-1">Recuperação</p>
            <p className="text-3xl font-bold text-orange-900">{recuperacao}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <p className="text-sm text-blue-700 mb-1">Média</p>
            <p className="text-3xl font-bold text-blue-900">{media}</p>
          </div>
        </div>

        {/* Notas por Disciplina */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notas por Disciplina</h3>
          </div>

          {estudante.notas.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma nota lançada ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disciplina
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nota
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estudante.notas.map((nota) => (
                    <tr key={nota.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {nota.disciplina.nome}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {nota.nota === -1 ? '-' : nota.nota.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(nota.status)}`}>
                          {getStatusText(nota.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

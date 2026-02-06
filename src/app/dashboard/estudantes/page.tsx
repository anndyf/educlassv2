import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Plus, GraduationCap, Upload, Users } from "lucide-react"
import EstudantesFilter from "./EstudantesFilter"

export const runtime = 'nodejs'

async function getEstudantes(filters: { search?: string; cursoId?: string; turmaId?: string; turno?: string; serie?: string }) {
  const where: any = {}

  if (filters.search) {
    where.nome = {
      contains: filters.search,
      mode: 'insensitive'
    }
  }

  if (filters.turmaId) {
    where.turmaId = filters.turmaId
  } else {
    // Se não tiver turma específica, filtra por propriedades da turma (curso/turno/serie)
    const turmaWhere: any = {}
    
    // Suporte híbrido: Filtra tanto pelo ID do curso (novo) quanto pelo nome do curso (legado)
    if (filters.cursoId) {
      turmaWhere.OR = [
        { cursoId: filters.cursoId },
        { curso: filters.cursoId }
      ]
    }

    if (filters.turno) turmaWhere.turno = filters.turno
    if (filters.serie) turmaWhere.serie = { contains: filters.serie }
    
    if (Object.keys(turmaWhere).length > 0) {
      where.turma = turmaWhere
    }
  }

  return await prisma.estudante.findMany({
    where,
    include: {
      turma: true,
      _count: {
        select: {
          notas: true
        }
      }
    },
    orderBy: {
      nome: 'asc'
    }
  })
}

export default async function EstudantesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const resolvedParams = await searchParams
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined
  const cursoId = typeof resolvedParams.cursoId === 'string' ? resolvedParams.cursoId : undefined
  const turmaId = typeof resolvedParams.turmaId === 'string' ? resolvedParams.turmaId : undefined
  const turno = typeof resolvedParams.turno === 'string' ? resolvedParams.turno : undefined
  const serie = typeof resolvedParams.serie === 'string' ? resolvedParams.serie : undefined

  // Utilizando cast 'any' para evitar erros de lint stale com o cliente Prisma gerado
  const [estudantes, dbCursos, turmas] = await Promise.all([
    getEstudantes({ search, cursoId, turmaId, turno, serie }),
    (prisma as any).curso.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' }
    }),
    (prisma as any).turma.findMany({
      select: { id: true, nome: true, cursoId: true, turno: true, curso: true, serie: true },
      orderBy: { nome: 'asc' }
    })
  ])

  // Combinar cursos do banco (novos) com cursos legados (strings nas turmas)
  const legacyCursos = Array.from(new Set(
    turmas
      .filter((t: any) => t.curso && !t.cursoId)
      .map((t: any) => t.curso)
  )).map(nome => ({ id: nome as string, nome: nome as string }))

  const cursos = [...dbCursos, ...legacyCursos].sort((a, b) => a.nome.localeCompare(b.nome))

  console.log(`Dados carregados - Estudantes: ${estudantes.length}, Cursos: ${cursos.length}, Turmas: ${turmas.length}`)

  const hasFilters = !!(search || cursoId || turmaId || turno || serie)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Estudantes</h1>
                <p className="text-sm text-gray-600">Gerenciar cadastro de alunos</p>
              </div>
            </div>
            <div className={`flex items-center space-x-2 ${!session.user.isSuperuser ? 'hidden' : ''}`}>
              <Link
                href="/dashboard/estudantes/importar"
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-lg"
              >
                <Upload className="w-5 h-5" />
                <span>Importar Turma</span>
              </Link>
              <Link
                href="/dashboard/estudantes/novo"
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Estudante</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
           <EstudantesFilter cursos={cursos} turmas={turmas} totalResults={estudantes.length} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {estudantes.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasFilters ? 'Nenhum estudante encontrado' : 'Nenhum estudante cadastrado'}
              </h3>
              <p className="text-gray-600 mb-6">
                {hasFilters 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Comece adicionando o primeiro estudante'}
              </p>
              {!hasFilters && (
                <Link
                  href="/dashboard/estudantes/novo"
                  className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Adicionar Primeiro Estudante</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas Lançadas
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estudantes.map((estudante: any) => (
                    <tr key={estudante.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {estudante.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {estudante.nome}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {estudante.turma.nome}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {estudante._count.notas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/estudantes/${estudante.id}/editar`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/dashboard/estudantes/${estudante.id}/boletim`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Boletim
                        </Link>
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

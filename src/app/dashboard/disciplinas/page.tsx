import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, BookOpen } from "lucide-react"
import { getDisciplinasPermitidas } from "@/lib/data-fetching"
import DisciplinasList from "./DisciplinasList"

export const runtime = 'nodejs'

export default async function DisciplinasPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const disciplinas = await getDisciplinasPermitidas(session)

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
                <h1 className="text-2xl font-bold text-gray-900">Disciplinas</h1>
                <p className="text-sm text-gray-600">Cadastrar e editar disciplinas</p>
              </div>
            </div>
            <Link
              href="/dashboard/disciplinas/nova"
              className={`flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg ${!session.user.isSuperuser ? 'hidden' : ''}`}
            >
              <Plus className="w-5 h-5" />
              <span>Nova Disciplina</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {disciplinas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma disciplina cadastrada
            </h3>
            <p className="text-gray-600 mb-6">
              Comece criando sua primeira disciplina
            </p>
            <Link
              href="/dashboard/disciplinas/nova"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Criar Primeira Disciplina</span>
            </Link>
          </div>
        ) : (
          <DisciplinasList disciplinas={disciplinas} />
        )}
      </main>
    </div>
  )
}

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Gavel, CheckCircle2, TrendingUp } from "lucide-react"
import { getTurmasPermitidas } from "@/lib/data-fetching"

export const runtime = 'nodejs'

import ConselhoClasseList from "./ConselhoClasseList"

async function getTurmasComConselho(session: any) {
  const turmasPermitidas = await getTurmasPermitidas(session)
  const turmasIds = turmasPermitidas.map(t => t.id)

  const turmas = await prisma.turma.findMany({
    where: {
      id: { in: turmasIds }
    },
    include: {
      estudantes: {
        include: {
          notas: {
            where: {
              OR: [
                { status: 'RECUPERACAO', notaRecuperacao: { lt: 5 } },
                { status: { in: ['APROVADO_CONSELHO', 'DEPENDENCIA', 'CONSERVADO'] } }
              ]
            }
          }
        }
      }
    },
    orderBy: {
      nome: 'asc'
    }
  })

  const turmasProcessadas = turmas.filter(turma => 
    turma.estudantes.some(est => est.notas.length > 0)
  ).map(turma => {
    const estudantesComNota = turma.estudantes.filter(e => e.notas.length > 0)
    const pendentes = estudantesComNota.filter(e => e.notas.some(n => n.status === 'RECUPERACAO')).length
    
    return {
      id: turma.id,
      nome: turma.nome,
      curso: turma.curso || 'Outros',
      turno: turma.turno || 'Não Definido',
      totalAlunosPendentes: pendentes,
      totalAlunosResolvidos: estudantesComNota.length - pendentes,
      isResolvido: pendentes === 0
    }
  })

  const grupos: Record<string, Record<string, any[]>> = {}
  
  turmasProcessadas.forEach(t => {
    const turno = t.turno
    const curso = t.curso
    
    if (!grupos[turno]) grupos[turno] = {}
    if (!grupos[turno][curso]) grupos[turno][curso] = []
    grupos[turno][curso].push(t)
  })

  return grupos
}

export default async function ConselhoClassePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const grupos = await getTurmasComConselho(session)
  const turnos = Object.keys(grupos)

  const totalPendentes = turnos.reduce((acc, t) => acc + Object.values(grupos[t]).reduce((a, c) => a + c.filter((t: any) => !t.isResolvido).length, 0), 0)
  const totalFinalizados = turnos.reduce((acc, t) => acc + Object.values(grupos[t]).reduce((a, c) => a + c.filter((t: any) => t.isResolvido).length, 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Conselho de Classe</h1>
              <p className="text-sm text-slate-600">Gestão de deliberações e fechamento letivo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner - Estilo Recuperação (Cor Azul) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Painel de Conselho</h2>
              <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
                Central de decisões para alunos em recuperação final. 
                Aqui você realiza o fechamento letivo e as deliberações de aprovação pelo conselho.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[110px] text-center">
                <p className="text-blue-100 text-[10px] font-medium uppercase tracking-wider mb-0.5">Pendências</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{totalPendentes}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[110px] text-center">
                <p className="text-blue-100 text-[10px] font-medium uppercase tracking-wider mb-0.5">Finalizados</p>
                <p className="text-2xl font-bold text-white tracking-tighter">{totalFinalizados}</p>
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/5 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black/10 rounded-full blur-3xl opacity-40" />
        </div>

        {turnos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Tudo em dia!</h2>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">
                Não existem turmas aguardando deliberação de conselho no momento.
              </p>
          </div>
        ) : (
          <ConselhoClasseList gruposIniciais={grupos} />
        )}
      </main>
    </div>
  )
}

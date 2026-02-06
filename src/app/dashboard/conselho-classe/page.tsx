import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Users, Gavel, GraduationCap, CheckCircle2 } from "lucide-react"
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

  // Mapear turmas e determinar se estão resolvidas ou pendentes
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

  // Agrupar por Turno -> Curso
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Conselho de Classe</h1>
              <p className="text-sm text-gray-500 font-medium">Gestão de deliberações e fechamento letivo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Informativo */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 rounded-[2.5rem] p-8 mb-10 shadow-2xl shadow-slate-200">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
              <div className="bg-pink-500 rounded-[2rem] p-5 shadow-xl shadow-pink-500/20">
                <Gavel className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">
                  Painel de Controle
                </h3>
                <p className="text-slate-400 text-sm max-w-xl leading-relaxed font-medium">
                  Central de decisões para alunos em recuperação. Utilize a barra de busca abaixo para localizar turmas rapidamente entre as 60 unidades.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end space-y-3">
               <div className="flex space-x-4">
                  <div className="flex flex-col items-center px-6 py-3 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pendências</span>
                    <span className="text-xl font-black text-pink-500">
                      {turnos.reduce((acc, t) => acc + Object.values(grupos[t]).reduce((a, c) => a + c.filter((t: any) => !t.isResolvido).length, 0), 0)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-6 py-3 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Finalizados</span>
                    <span className="text-xl font-black text-emerald-500">
                      {turnos.reduce((acc, t) => acc + Object.values(grupos[t]).reduce((a, c) => a + c.filter((t: any) => t.isResolvido).length, 0), 0)}
                    </span>
                  </div>
               </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        </div>

        {turnos.length === 0 ? (
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-20 text-center">
              <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Tudo Limpo!</h2>
              <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm">
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

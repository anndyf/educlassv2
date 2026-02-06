import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  TrendingUp,
  Award
} from "lucide-react"
import Link from "next/link"

import { Session } from "next-auth"

async function getDashboardStats(session: Session) {
  const isManagement = session.user.isSuperuser || session.user.isDirecao

  if (isManagement) {
    const [turmasCount, disciplinasCount, estudantesCount, notasCount] = await Promise.all([
      prisma.turma.count(),
      prisma.disciplina.count(),
      prisma.estudante.count(),
      prisma.notaFinal.count()
    ])

    return {
      turmas: turmasCount,
      disciplinas: disciplinasCount,
      estudantes: estudantesCount,
      notas: notasCount
    }
  }

  // Estatísticas personalizadas para Professor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      disciplinasPermitidas: {
        select: {
          id: true,
          turmaId: true
        }
      }
    }
  })

  const disciplinasIds = user?.disciplinasPermitidas.map(d => d.id) || []
  const turmasIds = Array.from(new Set(user?.disciplinasPermitidas.map(d => d.turmaId) || []))

  const [estudantesCount, notasCount] = await Promise.all([
    prisma.estudante.count({
      where: { turmaId: { in: turmasIds } }
    }),
    prisma.notaFinal.count({
      where: { disciplinaId: { in: disciplinasIds } }
    })
  ])

  return {
    turmas: turmasIds.length,
    disciplinas: disciplinasIds.length,
    estudantes: estudantesCount,
    notas: notasCount
  }
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const stats = await getDashboardStats(session)

  const allCards = [
    {
      title: "Minhas Turmas",
      value: stats.turmas,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      href: "/dashboard/notas",
      visible: true // Sempre visível, mas os dados mudam conforme o papel
    },
    {
      title: "Minhas Disciplinas",
      value: stats.disciplinas,
      icon: BookOpen,
      color: "from-purple-500 to-purple-600",
      href: "/dashboard/notas",
      visible: true
    },
    {
      title: "Estudantes",
      value: stats.estudantes,
      icon: GraduationCap,
      color: "from-green-500 to-green-600",
      href: "/dashboard/estudantes",
      visible: session.user.isSuperuser || session.user.isDirecao
    },
    {
      title: "Notas Lançadas",
      value: stats.notas,
      icon: FileText,
      color: "from-orange-500 to-orange-600",
      href: "/dashboard/notas",
      visible: true // Todos podem ver o volume de trabalho
    }
  ]

  const cards = allCards.filter(c => c.visible)

  const allQuickActions = [
    {
      title: "Lançar Notas",
      description: "Lançar notas finais por turma",
      icon: Award,
      href: "/dashboard/notas",
      color: "bg-blue-600 hover:bg-blue-700",
      visible: session.user.isStaff || session.user.isSuperuser
    },
    {
      title: "Lançar Recuperação",
      description: "Registrar notas de recuperação",
      icon: TrendingUp,
      href: "/dashboard/notas/recuperacao",
      color: "bg-purple-600 hover:bg-purple-700",
      visible: session.user.isStaff || session.user.isSuperuser
    },
    {
      title: "Resultados",
      description: "Visualizar desempenho por unidade",
      icon: Users,
      href: "/dashboard/resultados",
      color: "bg-indigo-600 hover:bg-indigo-700",
      visible: session.user.isDirecao || session.user.isSuperuser
    },
    {
      title: "Conselho de Classe",
      description: "Definir situação de alunos em recuperação",
      icon: Award,
      href: "/dashboard/conselho-classe",
      color: "bg-pink-600 hover:bg-pink-700",
      visible: session.user.isDirecao || session.user.isSuperuser
    }
  ]

  const quickActions = allQuickActions.filter(a => a.visible)

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Welcome Section - Compact Version */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200 border border-slate-800">
        <div className="relative z-10">
          {/* Mobile Layout - Centralizado */}
          <div className="md:hidden flex flex-col items-center text-center space-y-4">
            {/* Ilustração centralizada */}
            <div className="relative w-32 h-32 mb-2">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/50">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="absolute top-1/2 right-0 translate-x-2 -translate-y-1/2">
                <div className="w-9 h-9 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
                <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="absolute top-1/2 left-0 -translate-x-2 -translate-y-1/2">
                <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <svg className="absolute inset-0 w-full h-full" style={{zIndex: -1}}>
                <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                <line x1="50%" y1="50%" x2="90%" y2="50%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                <line x1="50%" y1="50%" x2="10%" y2="50%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              </svg>
            </div>
            
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide leading-tight">
              Centro Territorial de Educação Profissional do Litoral Norte e Agreste Baiano
            </p>
            
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded-full">
              <span className="w-1 h-1 bg-pink-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-pink-500 uppercase tracking-wider">Painel</span>
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">{session.user.name?.split(' ')[0]}</span>!<br />
              Gerencie tudo em um só lugar.
            </h2>
            
            <p className="text-slate-400 font-medium text-sm max-w-sm leading-relaxed">
              Acompanhe o desenvolvimento dos estudantes e tome decisões pedagógicas fundamentadas em dados.
            </p>
          </div>
          
          {/* Desktop Layout - Lado a lado */}
          <div className="hidden md:flex md:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide leading-tight mb-3">
                Centro Territorial de Educação Profissional do Litoral Norte e Agreste Baiano
              </p>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded-full">
                <span className="w-1 h-1 bg-pink-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-pink-500 uppercase tracking-wider">Painel</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mt-2">
                Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">{session.user.name?.split(' ')[0]}</span>!<br />
                Gerencie tudo em um só lugar.
              </h2>
              <p className="text-slate-400 font-medium text-sm max-w-md leading-relaxed mt-3">
                Acompanhe o desenvolvimento dos estudantes e tome decisões pedagógicas fundamentadas em dados.
              </p>
            </div>
            
            {/* Ilustração - Desktop */}
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32 lg:w-40 lg:h-40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/50">
                    <GraduationCap className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                  </div>
                </div>
                
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="absolute top-1/2 right-0 translate-x-2 -translate-y-1/2">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="absolute top-1/2 left-0 -translate-x-2 -translate-y-1/2">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <svg className="absolute inset-0 w-full h-full" style={{zIndex: -1}}>
                  <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                  <line x1="50%" y1="50%" x2="90%" y2="50%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                  <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                  <line x1="50%" y1="50%" x2="10%" y2="50%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements - Smaller for less bloat */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all hover:-translate-y-1 block relative overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">{card.title}</h3>
                  <div className="flex items-end space-x-2">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{card.value}</p>
                    <div className="pb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-[1rem] flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-slate-50/50 rounded-full blur-2xl group-hover:bg-pink-50/50 transition-colors" />
            </Link>
          )
        })}
      </div>

      {/* Action Center */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">Centro de Operações</h3>
          <div className="h-px bg-slate-100 flex-1 mx-6" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group relative bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-2xl transition-all active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex items-center space-x-4">
                  <div className={`w-12 h-12 ${action.color.split(' ')[0]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-0.5 truncate">{action.title}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">
                      {action.description}
                    </p>
                  </div>
                </div>
                
                <div className="absolute right-4 opacity-0 group-hover:opacity-30 transition-opacity translate-x-2 group-hover:translate-x-0 transform duration-300">
                  <TrendingUp className="rotate-90 w-3 h-3 text-slate-400" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

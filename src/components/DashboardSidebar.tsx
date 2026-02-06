"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  Shield, 
  Menu,
  X,
  LogOut,
  Award
} from "lucide-react"
import { useState } from "react"

interface User {
  name?: string | null
  email?: string | null
  isSuperuser: boolean
  isDirecao: boolean
  isStaff: boolean
}

export default function DashboardSidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Definição de links baseada em roles
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ]

  // Direção e TI veem gestão total
  if (user.isSuperuser || user.isDirecao) {
    links.push({ name: "Turmas", href: "/dashboard/turmas", icon: Users })
    links.push({ name: "Disciplinas", href: "/dashboard/disciplinas", icon: BookOpen })
    links.push({ name: "Estudantes", href: "/dashboard/estudantes", icon: GraduationCap })
  }

  // Professores e TI veem lançamento
  if (user.isStaff || user.isSuperuser) {
    links.push({ name: "Lançar Notas", href: "/dashboard/notas", icon: FileText })
    links.push({ name: "Recuperação", href: "/dashboard/notas/recuperacao", icon: TrendingUp })
  }

  // Direção e TI veem resultados
  if (user.isDirecao || user.isSuperuser) {
    links.push({ name: "Resultados", href: "/dashboard/resultados", icon: Award })
    links.push({ name: "Conselho de Classe", href: "/dashboard/conselho-classe", icon: Users })
  }

  // Só TI vê Usuários
  if (user.isSuperuser) {
    links.push({ name: "Usuários", href: "/dashboard/usuarios", icon: Shield })
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Trigger */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-gray-700 hover:text-blue-600 print:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64
        bg-slate-900 text-white
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        flex flex-col
        shadow-2xl border-r border-slate-800
        print:hidden
      `}>
        {/* Logo Area */}
        <div className="flex flex-col items-center justify-center h-24 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              EduClass
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">CETEP/LNAB</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold border border-slate-700">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-100 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {user.isSuperuser ? "Administrador" : "Professor"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                  ${active 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }
                `}
              >
                <Icon className={`w-5 h-5 mr-3 transition-colors ${active ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
                <span className="font-medium text-sm">{link.name}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <form action="/api/auth/signout" method="post">
            <button 
              type="submit"
              className="flex items-center w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 mr-3 group-hover:text-red-400" />
              <span className="font-medium text-sm">Sair do Sistema</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

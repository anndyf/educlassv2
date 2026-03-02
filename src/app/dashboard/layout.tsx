import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardSidebar from "@/components/DashboardSidebar"
import SessionTimer from "@/components/SessionTimer"
import MessageNotification from "@/components/MessageNotification"
import { Code } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Se for usuário do portal, não acessa o dashboard administrativo
  if (session.user.isPortalUser) {
    redirect("/portal")
  }

  const config = await prisma.globalConfig.upsert({
    where: { id: 'global' },
    update: {},
    create: { 
      id: 'global', 
      isBancoQuestoesAtivo: true,
      anoLetivoAtual: new Date().getFullYear()
    }
  })

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900 print:min-h-0 print:bg-white print:block">
      <SessionTimer />
      <MessageNotification />
      <DashboardSidebar 
        user={session.user} 
        isBancoQuestoesAtivo={config.isBancoQuestoesAtivo} 
        anoLetivo={config.anoLetivoAtual}
      />
      
      <main className="flex-1 md:ml-64 min-h-screen transition-all duration-300 ease-in-out print:ml-0 print:p-0 print:min-h-0 print:block overflow-x-hidden flex flex-col">
        {/* Mobile Header Spacer */}
        <div className="h-16 md:h-0 w-full md:hidden bg-transparent print:hidden" />
        
        <div className="p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300 print:p-0 print:animate-none flex-1">
          {children}
        </div>
        
        {/* Footer com Copyright */}
        <footer className="mt-auto py-6 px-4 md:px-8 border-t border-slate-200 bg-white print:hidden">
            <div className="flex flex-col md:flex-row items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">EduClass</span>
              <span>•</span>
              <span className="font-medium">Sistema de Gestão</span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center">
              <span>© {new Date().getFullYear()} CETEP Litoral Norte e Agreste Baiano</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="text-slate-400">Todos os direitos reservados</span>
            </div>

            <div className="flex items-center gap-2 py-1 px-3 bg-slate-50 rounded-full border border-slate-100 shadow-sm ml-auto">
              <Code size={12} className="text-blue-600" />
              <span className="text-[10px] font-medium text-slate-400">Desenvolvido por</span>
              <span className="text-[10px] font-black text-slate-700 hover:text-blue-600 transition-colors cursor-default">Andressa Mirella</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

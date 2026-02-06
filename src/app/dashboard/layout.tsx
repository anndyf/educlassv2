import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardSidebar from "@/components/DashboardSidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans antialiased text-gray-900 print:min-h-0 print:bg-white print:block">
      <DashboardSidebar user={session.user} />
      
      <main className="flex-1 md:ml-64 min-h-screen transition-all duration-300 ease-in-out print:ml-0 print:p-0 print:min-h-0 print:block overflow-x-hidden flex flex-col">
        {/* Mobile Header Spacer */}
        <div className="h-16 md:h-0 w-full md:hidden bg-transparent print:hidden" />
        
        <div className="p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300 print:p-0 print:animate-none flex-1">
          {children}
        </div>
        
        {/* Footer com Copyright */}
        <footer className="mt-auto py-6 px-4 md:px-8 border-t border-gray-200 bg-white print:hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">EduClass</span>
              <span>•</span>
              <span>Sistema de Gestão Educacional</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <span>© {new Date().getFullYear()} CETEP Litoral Norte e Agreste Baiano</span>
              <span className="hidden md:inline">•</span>
              <span className="text-gray-400">Todos os direitos reservados</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

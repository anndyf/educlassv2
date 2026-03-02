import { auth } from "@/lib/auth"
import { getMessages, getUsersForSelect, getTurmasForSelect } from "./actions"
import MessagesClient from "./MessagesClient"
import { redirect } from "next/navigation"
import { LifeBuoy } from "lucide-react"

export default async function MessagesPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const { received, sent } = await getMessages()
  const users = await getUsersForSelect()
  const turmas = await getTurmasForSelect()

  // Transform User[] to the shape MessagesClient expects
  const userOptions = users.map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.isSuperuser ? "Admin" : u.isDirecao ? "Direção" : u.isStaff ? "Professor" : "Usuário",
    isStudent: !!u.estudanteId || u.isPortalUser
  }))

  const currentUserRole = {
    isSuperuser: session.user.isSuperuser,
    isDirecao: session.user.isDirecao,
    isStaff: session.user.isStaff
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Mensagens</h1>
          <p className="text-slate-500 font-medium">Central de comunicação e comunicados oficiais.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 bg-white border border-slate-100 px-6 py-3 rounded-3xl shadow-sm">
           <div className="flex items-center gap-2 group">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-200 group-hover:scale-125 transition-transform"></span>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Suporte</p>
           </div>
           <div className="flex items-center gap-2 group">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-200 group-hover:scale-125 transition-transform"></span>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Direção</p>
           </div>
           <div className="flex items-center gap-2 group">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 group-hover:scale-125 transition-transform"></span>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Geral</p>
           </div>
        </div>
      </div>

      {/* Alerta de Suporte Fixo */}
      <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="w-14 h-14 bg-white rounded-2xl shadow-xl shadow-blue-200/50 flex items-center justify-center shrink-0">
          <LifeBuoy className="text-blue-600 w-7 h-7" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">
             Precisa de ajuda com os dados?
          </p>
          <p className="text-sm font-semibold text-blue-700 leading-relaxed">
            Se não estiver visualizando uma <span className="underline decoration-blue-300 decoration-2 underline-offset-4">turma</span>, 
            <span className="ml-1 underline decoration-blue-300 decoration-2 underline-offset-4">disciplina</span> ou 
            <span className="ml-1 underline decoration-blue-300 decoration-2 underline-offset-4">estudante</span>, 
            selecione a categoria <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] uppercase font-black">Suporte Técnico</span> ao enviar sua mensagem.
          </p>
        </div>
      </div>
      <MessagesClient 
        receivedMessages={received as any} 
        sentMessages={sent as any}
        users={userOptions}
        turmas={turmas}
        currentUserRole={currentUserRole}
        currentUserId={session.user.id}
      />
    </div>
  )
}

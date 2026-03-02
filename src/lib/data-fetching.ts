import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

/**
 * Retorna as disciplinas que o usuário tem permissão de acessar.
 * Se for superuser, retorna todas.
 * Se for staff (professor), retorna apenas as que estão na lista de disciplinasPermitidas.
 */
export async function getDisciplinasPermitidas(session: Session) {
  const include = {
    turma: true,
    _count: {
      select: {
        notas: true
      }
    }
  }

  const config = await prisma.globalConfig.findUnique({ where: { id: 'global' } })
  const currentYear = config?.anoLetivoAtual || new Date().getFullYear()

  console.log(`[getDisciplinasPermitidas] Config loaded: ${JSON.stringify(config)}, Resolved Year: ${currentYear}`)

  if (session.user.isSuperuser || session.user.isDirecao) {
    return await prisma.disciplina.findMany({
      where: {
        turma: {
          anoLetivo: currentYear
        }
      },
      orderBy: { nome: 'asc' },
      include
    })
  }

  // Se não for superuser, busca as disciplinas permitidas
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      disciplinasPermitidas: {
        orderBy: { nome: 'asc' },
        include
      }
    }
  })

  return (user?.disciplinasPermitidas || []).filter((d: any) => d.turma.anoLetivo === currentYear)
}

/**
 * Retorna as turmas que o usuário tem permissão de acessar.
 * Se for superuser, retorna todas.
 * Se for staff, retorna turmas das disciplinas permitidas ou turmasPermitidas explicitamente.
 */
export async function getTurmasPermitidas(session: Session) {
  const config = await prisma.globalConfig.findUnique({ where: { id: 'global' } })
  const currentYear = config?.anoLetivoAtual || new Date().getFullYear()

  console.log(`[getTurmasPermitidas] Config loaded: ${JSON.stringify(config)}, Resolved Year: ${currentYear}`)

  if (session.user.isSuperuser || session.user.isDirecao) {
    return await prisma.turma.findMany({
      where: {
        anoLetivo: currentYear
      },
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: {
            estudantes: true,
            disciplinas: true
          }
        }
      }
    })
  }

  // Busca disciplinas permitidas para inferir turmas e contar apenas o que é dele
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      disciplinasPermitidas: {
        select: { 
          id: true,
          turmaId: true 
        }
      }
    }
  })

  if (!user) return []

  // Contar disciplinas permitidas por turma
  const countPorTurma: Record<string, number> = {}
  user.disciplinasPermitidas.forEach(d => {
    countPorTurma[d.turmaId] = (countPorTurma[d.turmaId] || 0) + 1
  })

  const turmaIds = Object.keys(countPorTurma)
  
  // Buscar turmas completas
  const turmas = await prisma.turma.findMany({
    where: {
      id: { in: turmaIds },
      anoLetivo: currentYear
    },
    include: {
      _count: {
        select: {
          estudantes: true
        }
      }
    },
    orderBy: { nome: 'asc' }
  })

  // Mapear para incluir o contador restrito
  return turmas.map(t => ({
    ...t,
    _count: {
      estudantes: t._count.estudantes,
      disciplinas: countPorTurma[t.id] || 0
    }
  }))
}

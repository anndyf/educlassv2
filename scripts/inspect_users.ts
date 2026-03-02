
import { prisma } from "../src/lib/prisma"

async function main() {
  const users = await prisma.user.findMany({
    where: {
      name: { in: ['Ana Excelente', 'João Aprovado', 'Maria Recuperação', 'Pedro Em Recuperação'] }
    },
    select: {
      id: true,
      name: true,
      username: true,
      // role: true, // removed
      estudanteId: true,
      isPortalUser: true,
      isSuperuser: true,
      isStaff: true,
      isDirecao: true
    }
  })

  // Compute role manually for display
  const usersWithRole = users.map(u => ({
    ...u,
    computedRole: u.isSuperuser ? "Admin" : u.isDirecao ? "Direção" : u.isStaff ? "Professor" : "Usuário"
  }))

  console.log(JSON.stringify(usersWithRole, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

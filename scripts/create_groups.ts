
import { prisma } from "../src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const groups = [
    { id: "GROUP_STUDENTS", username: "sys_group_students", name: "Todos os Estudantes", email: "students@system.local" },
    { id: "GROUP_TEACHERS", username: "sys_group_teachers", name: "Todos os Professores", email: "teachers@system.local" },
    { id: "GROUP_STAFF", username: "sys_group_staff", name: "Equipe Administrativa", email: "staff@system.local" },
    { id: "GROUP_DIRECAO", username: "sys_group_direcao", name: "Direção", email: "direcao@system.local" }
  ]

  const password = await bcrypt.hash("system_group_password", 10)

  for (const group of groups) {
    const existing = await prisma.user.findUnique({ where: { id: group.id } })
    if (!existing) {
      await prisma.user.create({
        data: {
          id: group.id,
          username: group.username,
          email: group.email,
          name: group.name,
          password: password,
          isActive: false, // Prevent login
          isApproved: true
        }
      })
      console.log(`Created group: ${group.name}`)
    } else {
      console.log(`Group already exists: ${group.name}`)
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

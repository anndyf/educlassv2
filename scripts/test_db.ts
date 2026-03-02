
import { prisma } from "../src/lib/prisma"

async function main() {
  try {
    const count = await prisma.user.count()
    console.log("User count:", count)
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()


import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
  dbUrl = dbUrl.substring(1, dbUrl.length - 1);
}

const pool = new Pool({
  connectionString: dbUrl!
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const turmas = await prisma.turma.findMany({
    include: {
      estudantes: true,
      disciplinas: true
    }
  });

  console.log(JSON.stringify(turmas, null, 2));
}

main().finally(() => prisma.$disconnect())

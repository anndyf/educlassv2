
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não configurada no .env')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const turma = await prisma.turma.findFirst({
    where: { nome: '2TIV1' },
    include: { disciplinas: true }
  })

  const user = await prisma.user.findFirst({
    where: { isSuperuser: true }
  })

  if (!turma) {
    console.error('Turma 2TIV1 não encontrada')
    return
  }

  if (!user) {
    console.error('Nenhum usuário admin encontrado')
    return
  }

  const questoes = [
    {
      enunciado: "Qual é a principal função de um algoritmo?",
      A: "Processar dados de forma aleatória.",
      B: "Fornecer uma sequência lógica de passos para resolver um problema.",
      C: "Aumentar a velocidade do hardware.",
      D: "Armazenar arquivos em nuvem.",
      E: "Criar designs gráficos avançados.",
      correta: "B",
      dificuldade: "FACIL"
    },
    {
      enunciado: "Em lógica de programação, o que é uma variável?",
      A: "Um valor que nunca muda.",
      B: "Um tipo de erro no código.",
      C: "Um espaço na memória para armazenar dados temporários.",
      D: "Uma função que imprime texto.",
      E: "O nome dado ao compilador.",
      correta: "C",
      dificuldade: "FACIL"
    },
    {
      enunciado: "Qual estrutura de controle é usada para repetição baseada em uma condição?",
      A: "IF",
      B: "SWITCH",
      C: "WHILE",
      D: "ELSE",
      E: "BREAK",
      correta: "C",
      dificuldade: "MEDIO"
    },
    {
      enunciado: "O que significa a sigla SQL no contexto de bancos de dados?",
      A: "Simple Query Language",
      B: "Structured Question List",
      C: "Structured Query Language",
      D: "System Quick Link",
      E: "Sequence Query Language",
      correta: "C",
      dificuldade: "FACIL"
    },
    {
      enunciado: "Qual o resultado da expressão lógica (TRUE AND FALSE)?",
      A: "TRUE",
      B: "FALSE",
      C: "NULL",
      D: "ERROR",
      E: "UNDEFINED",
      correta: "B",
      dificuldade: "FACIL"
    }
  ]

  console.log(`Iniciando alimentação para ${turma.disciplinas.length} disciplinas da turma 2TIV1...`)

  for (const disc of turma.disciplinas) {
    console.log(`Criando questões para: ${disc.nome}`)
    
    for (const q of questoes) {
      await prisma.questao.create({
        data: {
          enunciado: `[${disc.nome}] ${q.enunciado}`,
          alternativaA: q.A,
          alternativaB: q.B,
          alternativaC: q.C,
          alternativaD: q.D,
          alternativaE: q.E,
          correta: q.correta,
          dificuldade: q.dificuldade as any,
          professorId: user.id,
          status: 'APROVADA',
          disciplinas: { connect: { id: disc.id } },
          turmas: { connect: { id: turma.id } }
        }
      })
    }
  }

  console.log('Alimentação concluída com sucesso!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })


import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function seed() {
  try {
    const turmaNome = "2TIV1"
    const disciplinaNome = "Língua Portuguesa"
    const professorEmail = "admin@cetep.com" // Usando admin para garantir que exista

    // 1. Busca ou cria turma
    let turma = await prisma.turma.findFirst({ where: { nome: turmaNome } })
    if (!turma) {
      turma = await prisma.turma.create({
        data: { nome: turmaNome, anoLetivo: 2026 }
      })
      console.log(`Turma ${turmaNome} criada.`)
    }

    // 2. Busca ou cria disciplina
    let disciplina = await prisma.disciplina.findFirst({
      where: { nome: disciplinaNome, turmaId: turma.id }
    })
    if (!disciplina) {
      disciplina = await prisma.disciplina.create({
        data: { nome: disciplinaNome, turmaId: turma.id }
      })
      console.log(`Disciplina ${disciplinaNome} criada.`)
    }

    // 3. Busca professor
    const professor = await prisma.user.findUnique({ where: { email: professorEmail } })
    if (!professor) {
      console.error("Professor não encontrado!")
      return
    }

    // 4. Questões
    const questoes = [
      {
        enunciado: "Texto para a questão:\n\n'E agora, José?\nA festa acabou,\na luz apagou,\no povo sumiu,\na noite esfriou,\ne agora, José?\ne agora, você?\nvocê que é sem nome,\nque zomba dos outros,\nvocê que faz versos,\nque ama, protesta?\ne agora, José?\n\nEstá sem mulher,\nestá sem discurso,\nestá sem carinho,\njá não pode beber,\njá não pode fumar,\ncuspir já não pode,\na noite esfriou,\no dia não veio,\no bonde não veio,\no riso não veio,\nnão veio a utopia\ne tudo acabou\ne tudo fugiu\ne tudo mofou,\ne agora, José?'\n(Carlos Drummond de Andrade)\n\nO poema 'E agora, José?', de Carlos Drummond de Andrade, é um dos mais célebres da literatura brasileira. A repetição interrogativa 'E agora, José?' sugere um sentimento de:",
        dificuldade: "MEDIO",
        alternativas: {
            A: "Esperança renovada diante das adversidades da vida urbana.",
            B: "Impasse existencial, solidão e falta de perspectivas.",
            C: "Alegria contida pela celebração que acabou de terminar.",
            D: "Revolta política contra o sistema governamental vigente.",
            E: "Indiferença total em relação ao destino da humanidade."
        },
        correta: "B",
        muleta: "Observe a acumulação de negações e perdas ao longo do texto."
      },
      {
        enunciado: "Texto: 'O mito é o nada que é tudo.\nO mesmo sol que abre os céus\nÉ um mito brilhante e mudo\nO corpo morto de Deus,\nVivo e desnudo.\n\nEste, que aqui aportou,\nFoi por não ser existindo.\nSem existir nos bastou.\nPor não ter vindo foi vindo\nE nos criou.\n\nAssim a lenda se escorre\nA entrar na realidade,\nE a fecundá-la decorre.\nEm baixo, a vida, metade\nDe nada, morre.'\n(Fernando Pessoa, Mensagem)\n\nNo poema 'Ulisses', Fernando Pessoa reflete sobre a natureza do mito. O paradoxo 'O mito é o nada que é tudo' indica que:",
        dificuldade: "DIFICIL",
        alternativas: {
            A: "Os mitos são mentiras irrelevantes para a história.",
            B: "A realidade é superior à ficção em todos os aspectos.",
            C: "O mito, embora irreal fisicamente, fundamenta a identidade cultural.",
            D: "Deus é apenas uma invenção mitológica sem poder.",
            E: "A lenda destrói a realidade ao invés de criá-la."
        },
        correta: "C"
      },
      {
        enunciado: "Texto: 'Capitu, apesar daqueles olhos que o diabo lhe deu... Você já reparou nos olhos dela? São assim de cigana oblíqua e dissimulada. Pois apesar deles, poderia passar, se não fosse a vaidade e a adulação. Oh! A adulação! (...) Capitu era também mais mulher do que eu era homem.'\n(Machado de Assis, Dom Casmurro)\n\nNesse trecho, o narrador Bentinho descreve Capitu. A expressão 'olhos de cigana oblíqua e dissimulada' tornou-se clássica na literatura. O termo 'oblíqua' nesse contexto sugere:",
        dificuldade: "MEDIO",
        alternativas: {
            A: "Um olhar direto, sincero e sem segredos.",
            B: "Um estrabismo físico acentuado na personagem.",
            C: "Um olhar misterioso, enviesado, que não revela tudo o que pensa.",
            D: "Uma clareza absoluta nas intenções da personagem.",
            E: "Uma inocência infantil e pura."
        },
        correta: "C"
      },
      {
        enunciado: "Leia o fragmento de 'Vidas Secas':\n\n'Fabiano ia satisfeito. Sim senhor, arrumara-se. Chegara naquele estado, com a família morrendo de fome, comendo raízes. Caíra no fim do pátio, debaixo de um juazeiro, depois tomara conta da casa deserta. A patroa era boa, o patrão era brabo, mas a gente se habituava. Havia a seca, a catinga seca, a poeira, o calor. Mas havia também a água da lagoa, que a sinhá Terta benzia. E havia a cachorra Baleia, que era como uma pessoa da família.'\n\nO discurso indireto livre é um recurso narrativo presente na obra. Ele permite:",
        dificuldade: "DIFICIL",
        alternativas: {
            A: "Separar rigidamente a fala do narrador da fala do personagem.",
            B: "Fundir a voz do narrador com os pensamentos do personagem.",
            C: "Criar diálogos diretos marcados por travessões.",
            D: "Eliminar a subjetividade do personagem da narrativa.",
            E: "Transformar a narrativa em um texto jornalístico imparcial."
        },
        correta: "B"
      },
      {
        enunciado: "Texto:\n'Catar feijão se limita com escrever:\njoga-se os grãos na água do alguidar\ne as palavras na folha de papel;\ne depois, joga-se fora o que boiar.\nA certo ponto, diz: tudo o que boia é o que está podre.\nQue atire a primeira pedra quem nunca ignorou o tesouro que é o feijão que não boia.'\n(João Cabral de Melo Neto - Catar Feijão)\n\nNeste poema, João Cabral de Melo Neto estabelece uma metalinguagem comparando o ato de escrever ao ato de catar feijão. A comparação ressalta que a escrita exige:",
        dificuldade: "MEDIO",
        alternativas: {
            A: "Inspiração divina e espontânea.",
            B: "Sentimentalismo exagerado e romântico.",
            C: "Seleção rigorosa, trabalho braçal e eliminação do supérfluo.",
            D: "Sorte para encontrar as melhores palavras rapidamente.",
            E: "Aceitação de qualquer ideia que venha à mente."
        },
        correta: "C"
      },
      {
        enunciado: "Texto Publicitário:\n'Aqueça seu inverno com a nova coleção de cobertores Conforto. Tão macios que você vai querer que o frio dure para sempre. Aproveite: leve 3 e pague 2. Só neste fim de semana!'\n\nAs funções da linguagem predominantes no texto acima são:",
        dificuldade: "FACIL",
        alternativas: {
            A: "Emotiva (foco no emissor) e Poética (foco na mensagem).",
            B: "Referencial (foco na informação) e Metalinguística (foco no código).",
            C: "Conativa (foco no receptor/convencimento) e Referencial.",
            D: "Fática (foco no canal) e Emotiva.",
            E: "Poética e Metalinguística."
        },
        correta: "C",
        muleta: "A função conativa busca persuadir o leitor (imperativos: aproveite, leve)."
      },
      {
        enunciado: "Texto Jornalístico:\n'O avanço da inteligência artificial generativa tem levantado debates éticos em todo o mundo. Enquanto defensores apontam o aumento da produtividade e a democratização da criação de conteúdo, críticos alertam para o risco de desemprego em massa, violação de direitos autorais e a disseminação de desinformação em escala industrial. A regulação dessas tecnologias tornou-se uma pauta urgente nos parlamentos globais.'\n\nO texto apresenta uma estrutura argumentativa baseada em:",
        dificuldade: "MEDIO",
        alternativas: {
            A: "Defesa unilateral de um único ponto de vista.",
            B: "Contraste de perspectivas (prós e contras) sobre o tema.",
            C: "Narrativa ficcional sobre o futuro da humanidade.",
            D: "Descrição técnica detalhada de algoritmos.",
            E: "Apelo emocional para banir a tecnologia."
        },
        correta: "B"
      },
      {
        enunciado: "Texto: 'Iracema, a virgem dos lábios de mel, que tinha os cabelos mais negros que a asa da graúna e mais longos que seu talhe de palmeira. O favo da jati não era doce como seu sorriso; nem a baunilha recendia no bosque como seu hálito perfumado.'\n(José de Alencar)\n\nA descrição de Iracema reflete uma característica marcante do Indianismo romântico, que é:",
        dificuldade: "FACIL",
        alternativas: {
            A: "A representação do indígena como um selvagem bárbaro e perigoso.",
            B: "A integração harmoniosa e idealizada entre o indígena e a natureza.",
            C: "A crítica à destruição das florestas pelos colonizadores.",
            D: "O retrato realista e fiel dos costumes tribais.",
            E: "A inferiorização da cultura nativa frente à europeia."
        },
        correta: "B"
      },
      {
        enunciado: "Soneto da Fidelidade (Vinicius de Moraes):\n'De tudo ao meu amor serei atento\nAntes, e com tal zelo, e sempre, e tanto\nQue mesmo em face do maior encanto\nDele se encante mais meu pensamento.\n\nQuero vivê-lo em cada vão momento\nE em seu louvor hei de espalhar meu canto\nE rir meu riso e derramar meu pranto\nAo seu pesar ou seu contentamento.'\n\nNos versos 'E rir meu riso e derramar meu pranto / Ao seu pesar ou seu contentamento', a figura de linguagem predominante é:",
        dificuldade: "MEDIO",
        alternativas: {
            A: "Eufemismo (suavização de uma ideia desagradável).",
            B: "Antítese (aproximação de ideias opostas: riso/pranto, pesar/contentamento).",
            C: "Hipérbole (exagero intencional).",
            D: "Metonímia (substituição da parte pelo todo).",
            E: "Pleonasmo vicioso (repetição desnecessária)."
        },
        correta: "B"
      },
      {
        enunciado: "Texto:\n'O bicho'\n'Vi ontem um bicho\nNa imundície do pátio\nCatando comida entre os detritos.\nQuando achava alguma coisa,\nNão examinava nem cheirava:\nEngolia com voracidade.\nO bicho não era um cão,\nNão era um gato,\nNão era um rato.\nO bicho, meu Deus, era um homem.'\n(Manuel Bandeira)\n\nO poema de Manuel Bandeira utiliza uma linguagem simples e direta para denunciar:",
        dificuldade: "MEDIO",
        alternativas: {
            A: "A poluição ambiental nas grandes cidades.",
            B: "O maltrato aos animais de rua.",
            C: "A degradação humana causada pela miséria extrema.",
            D: "A falta de higiene nos pátios públicos.",
            E: "A semelhança biológica entre homens e ratos."
        },
        correta: "C"
      }
    ]

    for (const q of questoes) {
      await prisma.questao.create({
        data: {
          enunciado: q.enunciado,
          alternativaA: q.alternativas.A,
          alternativaB: q.alternativas.B,
          alternativaC: q.alternativas.C,
          alternativaD: q.alternativas.D,
          alternativaE: q.alternativas.E,
          correta: q.correta,
          dificuldade: q.dificuldade as any,
          status: 'APROVADA',
          professorId: professor.id,
          disciplinas: { connect: { id: disciplina.id } },
          turmas: { connect: { id: turma.id } },
          imagemUrl: (q as any).imagemUrl,
          muleta: q.muleta
        }
      })
    }

    console.log(`${questoes.length} questões adicionadas com sucesso!`)

  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

seed()

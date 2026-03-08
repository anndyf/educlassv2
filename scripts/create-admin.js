
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@cetep.edu.br' },
    update: {},
    create: {
      email: 'admin@cetep.edu.br',
      username: 'admin',
      name: 'Administrador do Sistema',
      password: hashedPassword,
      isSuperuser: true,
      isStaff: true,
      isApproved: true,
      isActive: true,
      isDirecao: true
    },
  });

  console.log('--- USUÁRIO ADMINISTRADOR CRIADO COM SUCESSO ---');
  console.log('Login: admin@cetep.edu.br');
  console.log('Senha: admin123');
  console.log('----------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

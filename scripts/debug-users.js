const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', JSON.stringify(users, null, 2));
  process.exit(0);
}

check();

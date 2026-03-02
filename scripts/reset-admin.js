const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function reset() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { username: 'admin' },
    data: { password: hashedPassword }
  });
  console.log('Admin password reset to: admin123');
  process.exit(0);
}

reset();

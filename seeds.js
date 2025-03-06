/* eslint-disable no-console */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding guest user...');
  const guestPasswordHash = await bcrypt.hash('1', 10);

  await prisma.user.create({
    data: {
      username: 'Guest',
      passwordHash: guestPasswordHash,
      folders: { create: { path: '/', name: 'Home', isIndex: true } },
    },
  });

  console.log('Seeding complete');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

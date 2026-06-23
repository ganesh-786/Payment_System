import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const version = await prisma.$queryRaw`SELECT version()`;
  console.log('version:', version);
  const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
  console.log('tables:', tables);
  await prisma.$disconnect();
}
main().catch((err) => { console.error('error:', err); process.exit(1); });

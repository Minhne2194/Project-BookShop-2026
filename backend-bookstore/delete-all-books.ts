import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Đang xóa toàn bộ sách...');
  const result = await prisma.book.deleteMany({});
  console.log(`Đã xóa ${result.count} cuốn sách khỏi database.`);
}

main()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.log("ERROR:", e);
    await prisma.$disconnect();
    pool.end();
    process.exit(1);
  });

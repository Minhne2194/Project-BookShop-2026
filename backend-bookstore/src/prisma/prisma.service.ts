import 'dotenv/config'; // <-- DÒNG NÀY SẼ GIẢI QUYẾT TẤT CẢ! (Tự động đọc file .env)
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Lúc này process.env.DATABASE_URL chắc chắn đã có giá trị!
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Đã kết nối Database thành công!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
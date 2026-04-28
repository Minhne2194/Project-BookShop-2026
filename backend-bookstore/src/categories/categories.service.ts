import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; slug: string; level: number; parent_id?: string }) {
    return this.prisma.category.create({
      data: data,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: { children: true },
      orderBy: [
        { level: 'asc' },
        { sort_order: 'asc' },
        { name: 'asc' },
      ],
    });
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.book.create({
      data: {
        title: data.title,
        slug: data.slug,
        price: data.price,
        stock_qty: data.stock_qty,
        description: data.description,
        cover_url: data.cover_url,
      },
    });
  }

  async findAll() {
    return this.prisma.book.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.book.findUnique({
      where: { book_id: id },
    });
  }


// 4. Cập nhật thông tin sách (PUT)
  async update(id: string, data: any) {
    return this.prisma.book.update({
      where: { book_id: id },
      data: {
        title: data.title,
        slug: data.slug,
        price: data.price,
        stock_qty: data.stock_qty,
        description: data.description,
        cover_url: data.cover_url,
      },
    });
  }

  // 5. Xóa sách (DELETE)
  async remove(id: string) {
    try {
      await this.prisma.book.delete({
        where: { book_id: id },
      });
      return { message: 'Xóa sách thành công!' };
    } catch (error) {
      // Bắt lỗi: Nếu sách đã nằm trong đơn hàng của khách thì không cho xóa cứng
      if (error.code === 'P2003') {
        throw new BadRequestException('Không thể xóa! Cuốn sách này đã nằm trong hóa đơn của khách hàng.');
      }
      throw new BadRequestException('Có lỗi xảy ra khi xóa sách.');
    }
  }
}
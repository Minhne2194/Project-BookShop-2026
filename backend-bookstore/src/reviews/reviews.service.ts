import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}


  async create(userId: string, data: {
    book_id: string;
    order_id?: string;
    rating: number;
    title?: string;
    body?: string;
  }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5!');
    }


    if (data.order_id) {
      const existing = await this.prisma.review.findFirst({
        where: { user_id: userId, book_id: data.book_id, order_id: data.order_id },
      });
      if (existing) throw new BadRequestException('Bạn đã đánh giá cuốn sách này rồi!');
    }

    const review = await this.prisma.review.create({
      data: {
        book_id: data.book_id,
        user_id: userId,
        order_id: data.order_id ?? null,
        rating: data.rating,
        title: data.title,
        body: data.body,
        status: 'pending',
      },
    });


    await this.recalculateBookRating(data.book_id);

    return review;
  }


  async findByBook(bookId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { book_id: bookId, status: 'approved' },
        include: { user: { select: { full_name: true, email: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { book_id: bookId, status: 'approved' } }),
    ]);
    return { data: reviews, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }


  async findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { user_id: userId },
      include: { book: { select: { title: true, cover_url: true, slug: true } } },
      orderBy: { created_at: 'desc' },
    });
  }


  async findPending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { status: 'pending' },
        include: {
          user: { select: { full_name: true, email: true } },
          book: { select: { title: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { status: 'pending' } }),
    ]);
    return { data: reviews, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }


  async updateStatus(reviewId: string, status: 'approved' | 'rejected') {
    const review = await this.prisma.review.findUnique({ where: { review_id: reviewId } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá!');

    const updated = await this.prisma.review.update({
      where: { review_id: reviewId },
      data: { status },
    });

    // Nếu duyệt/từ chối thì tính lại rating sách
    await this.recalculateBookRating(review.book_id);

    return updated;
  }


  async voteHelpful(reviewId: string) {
    return this.prisma.review.update({
      where: { review_id: reviewId },
      data: { helpful_count: { increment: 1 } },
    });
  }


  private async recalculateBookRating(bookId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { book_id: bookId, status: 'approved' },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.book.update({
      where: { book_id: bookId },
      data: {
        avg_rating: stats._avg.rating ?? 0,
        rating_count: stats._count.rating,
      },
    });
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

@Injectable()
export class OrdersService {
  private redis: Redis;
  private readonly validOrderStatuses = new Set(Object.values(OrderStatus));

  constructor(private prisma: PrismaService) {
    this.redis = new Redis({ host: '127.0.0.1', port: 6379 });
  }

  private normalizePaymentMethod(paymentMethod?: string): PaymentMethod {
    switch (paymentMethod) {
      case PaymentMethod.bank_transfer:
      case 'bank':
        return PaymentMethod.bank_transfer;
      case PaymentMethod.momo:
        return PaymentMethod.momo;
      case PaymentMethod.vnpay:
        return PaymentMethod.vnpay;
      case PaymentMethod.cod:
      default:
        return PaymentMethod.cod;
    }
  }

  private normalizeOrderStatus(status: string): OrderStatus {
    const normalizedStatus = status?.toLowerCase() as OrderStatus | undefined;

    if (!normalizedStatus || !this.validOrderStatuses.has(normalizedStatus)) {
      throw new BadRequestException('Trạng thái đơn hàng không hợp lệ!');
    }

    return normalizedStatus;
  }

  async checkout(userId: string, body: { payment_method: any; shipping_address: any }) {
    const cartData = await this.redis.get(`cart:${userId}`);
    if (!cartData) throw new BadRequestException('Giỏ hàng của bạn đang trống!');
    
    const cart = JSON.parse(cartData);
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng của bạn đang trống!');
    }

    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of cart.items) {
      const book = await this.prisma.book.findUnique({ where: { book_id: item.bookId } });
      
      if (!book) throw new BadRequestException(`Sách ID ${item.bookId} không tồn tại!`);
      if (book.stock_qty < item.quantity) {
        throw new BadRequestException(`Sách "${book.title}" không đủ số lượng trong kho!`);
      }

      subtotal += Number(book.price) * item.quantity;

      orderItemsData.push({
        book_id: book.book_id,
        quantity: item.quantity,
        unit_price: book.price,
      });
    }

    const shippingFee = 30000;
    const totalAmount = subtotal + shippingFee;
    const paymentMethod = this.normalizePaymentMethod(body.payment_method);

    const order = await this.prisma.$transaction(async (tx) => {
      
      const newOrder = await tx.order.create({
        data: {
          order_code: `ORD-${Date.now()}`,
          user_id: userId,
          status: 'pending',
          subtotal: subtotal,
          shipping_fee: shippingFee,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: 'pending',
          shipping_address: body.shipping_address || {},
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      for (const item of cart.items) {
        await tx.book.update({
          where: { book_id: item.bookId },
          data: {
            stock_qty: { decrement: item.quantity },
            sold_count: { increment: item.quantity },
          },
        });
      }

      return newOrder;
    });

    await this.redis.del(`cart:${userId}`);

    return {
      message: 'Đặt hàng thành công!',
      order: order,
    };
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: { items: { include: { book: { select: { title: true, cover_url: true } } } } }
    });
  }
  async getAllOrdersForAdmin() {
    return this.prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { full_name: true, email: true } },
        items: { include: { book: { select: { title: true } } } }
      }
    });
  }

  async updateOrderStatus(orderId: string, status: any) {
    const normalizedStatus = this.normalizeOrderStatus(String(status ?? ''));

    return this.prisma.order.update({
      where: { order_id: orderId },
      data: { status: normalizedStatus }
    });
  }
}

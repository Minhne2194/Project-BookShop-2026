import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CartService {
  private redis: Redis;

  private readonly freeShipCodes: Set<string>;

  constructor() {
    this.redis = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });

    const envCodes = (process.env.FREE_SHIP_CODES || '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    this.freeShipCodes = new Set(['FREESHIP', 'MIENPHI', ...envCodes]);
  }

  async getCart(userId: string) {
    const cartData = await this.redis.get(`cart:${userId}`);
    if (cartData) {
      return JSON.parse(cartData);
    }
    return { items: [] };
  }

  async addToCart(userId: string, bookId: string, quantity: number) {
    const cart = await this.getCart(userId);

    const existingItem = cart.items.find((item: any) => item.bookId === bookId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ bookId, quantity });
    }

    await this.redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 604800);

    return cart;
  }

  async updateCartItem(userId: string, bookId: string, quantity: number) {
    const cart = await this.getCart(userId);

    const existingItem = cart.items.find((item: any) => item.bookId === bookId);

    if (!existingItem) {
      // If not in cart, add it
      cart.items.push({ bookId, quantity });
    } else if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      cart.items = cart.items.filter((item: any) => item.bookId !== bookId);
    } else {
      existingItem.quantity = quantity;
    }

    await this.redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 604800);
    return cart;
  }

  /**
   * Validate a promo code. Returns discount info if valid, error if not.
   */
  validatePromo(code: string) {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) {
      return { valid: false, message: 'Vui lòng nhập mã khuyến mãi.' };
    }
    if (this.freeShipCodes.has(normalized)) {
      return {
        valid: true,
        discount: 30000,
        description: 'Miễn phí vận chuyển',
      };
    }
    return {
      valid: false,
      message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.',
    };
  }

  async removeFromCart(userId: string, bookId: string) {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((item: any) => item.bookId !== bookId);

    await this.redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 604800);
    return cart;
  }
}

import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CartService {
  private redis: Redis;

  constructor() {
    // Kết nối tới con Redis đang chạy trong Docker của bạn
    this.redis = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });
  }

  // 1. Lấy giỏ hàng của User
  async getCart(userId: string) {
    const cartData = await this.redis.get(`cart:${userId}`);
    if (cartData) {
      return JSON.parse(cartData);
    }
    return { items:[] }; // Nếu chưa có giỏ hàng thì trả về mảng rỗng
  }

  // 2. Thêm sách vào giỏ hàng
  async addToCart(userId: string, bookId: string, quantity: number) {
    const cart = await this.getCart(userId);
    
    // Kiểm tra xem sách đã có trong giỏ chưa
    const existingItem = cart.items.find((item: any) => item.bookId === bookId);
    
    if (existingItem) {
      existingItem.quantity += quantity; // Nếu có rồi thì cộng dồn số lượng
    } else {
      cart.items.push({ bookId, quantity }); // Chưa có thì thêm mới
    }

    // Lưu lại vào Redis, set thời gian lưu trữ là 7 ngày (604800 giây)
    await this.redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 604800);
    
    return cart;
  }

  // 3. Xóa sách khỏi giỏ hàng
  async removeFromCart(userId: string, bookId: string) {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((item: any) => item.bookId !== bookId);
    
    // Lưu lại trạng thái giỏ hàng sau khi xóa
    await this.redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 604800);
    return cart;
  }
}
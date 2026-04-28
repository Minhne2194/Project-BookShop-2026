import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CartService {
  private redis: Redis;

  constructor() {

    this.redis = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });
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


  async removeFromCart(userId: string, bookId: string) {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((item: any) => item.bookId !== bookId);
    

    await this.redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 604800);
    return cart;
  }
}
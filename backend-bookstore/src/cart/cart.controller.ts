import { Controller, Get, Post, Body, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '../auth/auth.guard'; // Import chú bảo vệ

@UseGuards(AuthGuard) // BẮT BUỘC ĐĂNG NHẬP MỚI ĐƯỢC VÀO CÁC API NÀY
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Lấy giỏ hàng của user đang đăng nhập
  @Get()
  getCart(@Req() req: any) {
    const userId = req.user.sub; // Lấy ID của user từ thẻ Token
    return this.cartService.getCart(userId);
  }

  // Thêm sách vào giỏ hàng
  @Post('add')
  addToCart(@Req() req: any, @Body() body: { bookId: string; quantity: number }) {
    const userId = req.user.sub;
    return this.cartService.addToCart(userId, body.bookId, body.quantity);
  }

  // Xóa 1 cuốn sách khỏi giỏ hàng
  @Delete('remove/:bookId')
  removeFromCart(@Req() req: any, @Param('bookId') bookId: string) {
    const userId = req.user.sub;
    return this.cartService.removeFromCart(userId, bookId);
  }
}
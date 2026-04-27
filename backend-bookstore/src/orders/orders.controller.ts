import { Controller, Get, Post, Body, UseGuards, Req, Put, Param, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. API Đặt hàng
  @Post('checkout')
  checkout(@Req() req: any, @Body() body: any) {
    const userId = req.user.sub;
    return this.ordersService.checkout(userId, body);
  }

  // 2. API Xem lịch sử mua hàng của khách
  @Get('my-orders')
  getMyOrders(@Req() req: any) {
    const userId = req.user.sub;
    return this.ordersService.getMyOrders(userId);
  }

  // 3. API Lấy TẤT CẢ đơn hàng (Chỉ Admin) 
  // QUAN TRỌNG: Phải đặt chữ 'all' trên chữ ':id' để không bị đụng xe!
  @Get('all')
  getAllOrders(@Req() req: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Chỉ Admin mới có quyền xem!');
    return this.ordersService.getAllOrdersForAdmin();
  }

  // 4. API Cập nhật trạng thái đơn hàng (Chỉ Admin)
  @Put(':id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: any }) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Chỉ Admin mới có quyền sửa!');
    return this.ordersService.updateOrderStatus(id, body.status);
  }
}
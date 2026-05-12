import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Put,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Req() req: any, @Body() body: any) {
    const userId = req.user.sub;
    return this.ordersService.checkout(userId, body);
  }

  @Get('my-orders')
  getMyOrders(@Req() req: any) {
    const userId = req.user.sub;
    return this.ordersService.getMyOrders(userId);
  }

  @Get('all')
  getAllOrders(@Req() req: any) {
    if (req.user.role !== 'admin')
      throw new ForbiddenException('Chỉ Admin mới có quyền xem!');
    return this.ordersService.getAllOrdersForAdmin();
  }

  @Put(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: any },
  ) {
    if (req.user.role !== 'admin')
      throw new ForbiddenException('Chỉ Admin mới có quyền sửa!');
    return this.ordersService.updateOrderStatus(id, body.status);
  }

  @Get(':id/payment-info')
  getPaymentInfo(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.ordersService.getOrderForPayment(id, userId);
  }
}

import { Controller, Get, Post, Body, UseGuards, Req, Put, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register') 
  register(@Body() body: { email: string; password_raw: string; full_name?: string }) {
    return this.usersService.create(body);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() request: any) {
    const userId = request.user.sub;
    return this.usersService.getProfile(userId);
  }
  @UseGuards(AuthGuard)
  @Put('profile')
  updateProfile(@Req() request: any, @Body() body: { full_name?: string; phone?: string }) {
    const userId = request.user.sub;
    return this.usersService.updateProfile(userId, body);
  }
  @UseGuards(AuthGuard)
  @Delete('profile')
  deleteAccount(@Req() request: any) {
    const userId = request.user.sub;
    return this.usersService.deleteAccount(userId);
  }
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(
    @Body() body: { email: string; password_raw: string; full_name?: string },
  ) {
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
  updateProfile(
    @Req() request: any,
    @Body() body: { full_name?: string; phone?: string; gender?: string; birthday?: string },
  ) {
    const userId = request.user.sub;
    return this.usersService.updateProfile(userId, body);
  }

  @UseGuards(AuthGuard)
  @Delete('profile')
  deleteAccount(@Req() request: any) {
    const userId = request.user.sub;
    return this.usersService.deleteAccount(userId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // --- Address Book ---

  @UseGuards(AuthGuard)
  @Get('addresses')
  getAddresses(@Req() request: any) {
    const userId = request.user.sub;
    return this.usersService.getAddresses(userId);
  }

  @UseGuards(AuthGuard)
  @Post('addresses')
  addAddress(
    @Req() request: any,
    @Body()
    body: {
      receiver_name: string;
      phone: string;
      province: string;
      district: string;
      ward: string;
      street: string;
      is_default?: boolean;
      address_type?: string;
    },
  ) {
    const userId = request.user.sub;
    return this.usersService.addAddress(userId, body);
  }

  @UseGuards(AuthGuard)
  @Put('addresses/:id')
  updateAddress(
    @Req() request: any,
    @Param('id') addressId: string,
    @Body()
    body: {
      receiver_name?: string;
      phone?: string;
      province?: string;
      district?: string;
      ward?: string;
      street?: string;
      is_default?: boolean;
      address_type?: string;
    },
  ) {
    const userId = request.user.sub;
    return this.usersService.updateAddress(userId, addressId, body);
  }

  @UseGuards(AuthGuard)
  @Delete('addresses/:id')
  deleteAddress(@Req() request: any, @Param('id') addressId: string) {
    const userId = request.user.sub;
    return this.usersService.deleteAddress(userId, addressId);
  }
}

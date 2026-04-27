import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { async } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { email: string; password_raw: string; full_name?: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng!');
    }

    const hashedPassword = await argon2.hash(data.password_raw);

    const newUser = await this.prisma.user.create({
      data: {
        email: data.email,
        password_hash: hashedPassword,
        full_name: data.full_name,
      },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true,
      }
    });

    return newUser;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { user_id: true, email: true, full_name: true, role: true }
    });
  }

  // Lấy thông tin cá nhân
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { email: true, full_name: true, phone: true } // Chỉ lấy thông tin cần thiết
    });
  }

  // Cập nhật thông tin cá nhân
  async updateProfile(userId: string, data: { full_name?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { user_id: userId },
      data: {
        full_name: data.full_name,
        phone: data.phone,
      },
      select: { email: true, full_name: true, phone: true }
    });
  }

  async deleteAccount(userId: string) {
    try {
      await this.prisma.user.delete({
        where: { user_id: userId },
      });
      return { message: 'Xóa tài khoản thành công' };
    } catch (error) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Không thể xóa tài khoản vì bạn đã có lịch sử giao dịch (đơn hàng/đánh giá) trong hệ thống.');
      }
      throw new BadRequestException('Có lỗi xảy ra khi xóa tài khoản.');
    }
  }
}

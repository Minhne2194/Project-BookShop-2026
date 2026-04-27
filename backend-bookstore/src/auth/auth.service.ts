import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(email: string, password_raw: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    const isPasswordValid = await argon2.verify(user.password_hash, password_raw);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    const payload = { sub: user.user_id, email: user.email, role: user.role };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.user_id,
        email: user.email,
        name: user.full_name,
        role: user.role
      }
    };
  }
}
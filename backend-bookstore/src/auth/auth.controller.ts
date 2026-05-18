import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth') // Đường dẫn: http://localhost:3000/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // Endpoint: http://localhost:3000/auth/login
  login(@Body() body: { email: string; password_raw: string; guest_id?: string }) {
    return this.authService.login(body.email, body.password_raw, body.guest_id);
  }

  @Post('refresh')
  refreshToken(@Body() body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token);
  }
}

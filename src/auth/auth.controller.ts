import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  async signup(@Body() createUserDto: CreateUserDto) {
    await this.authService.register(createUserDto);
    return { message: 'User registered successfully' };
  }

  @Post('signin')
  @HttpCode(200)
  async signin(@Body() loginUserDto: LoginUserDto) {
    const tokens = await this.authService.login(loginUserDto);
    return {
      message: 'User signed in successfully',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    const tokens = await this.authService.refreshToken(refreshToken);
    return {
      message: 'Token refreshed successfully',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }
}

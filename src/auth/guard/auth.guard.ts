import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/database/redis.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,

    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token missing');
    }

    const decodedToken = this.verifyToken(token);
    if (!decodedToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const isBlocked = await this.redisService.get(`blocklist:${token}`);

    if (isBlocked) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userModel.findById(decodedToken.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Attach user to request object for access in controllers
    request.user = user;
    return true;
  }

  verifyToken(token: string) {
    try {
      const decodedToken = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      return decodedToken;
    } catch (error) {
      return null;
    }
  }
}

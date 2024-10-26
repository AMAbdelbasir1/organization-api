import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RedisService } from 'src/database/redis.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<void> {
    const { name, email, password } = createUserDto;

    const existingUser = await this.userModel.findOne({ email });
    console.log(existingUser);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new this.userModel({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();
  }

  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginUserDto;
    const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { userId: user._id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decodedToken = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const isBlocked = await this.redisService.get(
        `blocklist:${refreshToken}`,
      );

      if (isBlocked) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = await this.userModel.findById(decodedToken.userId);

      if (!user._id) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const tokenAge = decodedToken.exp - decodedToken.iat;
      await this.redisService.set(
        `blocklist:${refreshToken}`,
        'true',
        tokenAge + 1,
      );

      const payload = { userId: user._id, email: user.email };
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (
        error.name === 'TokenExpiredError' ||
        error.name === 'JsonWebTokenError' ||
        error.name === 'UnauthorizedException'
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      throw new InternalServerErrorException('Failed to refresh token');
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis'; // Import Redis correctly

@Injectable()
export class RedisService {
  private readonly redisClient: Redis; // Use Redis as a type for the client

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL'); // Use REDIS_URL

    this.redisClient = new Redis(redisUrl); // Initialize Redis client with the URL

    this.redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  getClient(): Redis {
    return this.redisClient; // Return the Redis client instance
  }

  async set(
    key: string,
    value: string,
    expireInSeconds?: number,
  ): Promise<void> {
    await this.redisClient.set(key, value);
    if (expireInSeconds) {
      await this.redisClient.expire(key, expireInSeconds);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }
}

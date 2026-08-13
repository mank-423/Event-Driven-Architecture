// src/ratelimiter/rate-limiter.service.ts
import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RateLimiterService {
  private readonly LIMIT = 40; // 40 requests per minute
  private readonly WINDOW = 60; // 60 seconds (1 minute)
  private readonly KEY_PREFIX = 'rate_limit';

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * Check if the hotel is allowed to make a request.
   * Returns true if allowed, throws exception if rate limit exceeded.
   */
  async checkAndIncrement(hotelId: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `${this.KEY_PREFIX}:${hotelId}`;

    try {
      // 🔥 Lua script for atomic check-and-increment
      // This ensures no race conditions between checking and incrementing
      const script = `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])

        -- Get current count
        local current = redis.call('GET', key)
        if current == false then
          -- Key doesn't exist - create it with TTL
          redis.call('SET', key, 1, 'EX', window)
          return {1, 1, window}
        end

        current = tonumber(current)
        if current >= limit then
          -- Rate limit exceeded
          local ttl = redis.call('TTL', key)
          return {0, current, ttl}
        end

        -- Increment count
        local newCount = redis.call('INCR', key)
        -- Refresh TTL
        redis.call('EXPIRE', key, window)
        return {1, newCount, window}
      `;

      const result = await this.redis.eval(
        script,
        1,
        key,
        this.LIMIT.toString(),
        this.WINDOW.toString(),
      ) as [number, number, number];

      const [allowed, count, ttl] = result;

      const remaining = Math.max(0, this.LIMIT - count);

      if (allowed === 0) {
        // Rate limit exceeded
        throw new HttpException(
          {
            success: false,
            message: `Rate limit exceeded. Maximum ${this.LIMIT} requests per minute.`,
            limit: this.LIMIT,
            remaining: 0,
            reset: new Date(Date.now() + (ttl * 1000)).toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS, // 429
        );
      }

      return {
        allowed: true,
        remaining,
      };
    } catch (error) {
      // If Redis fails, log and allow the request (fail-open)
      // This ensures the service stays up even if Redis is down
      console.error(`Rate limiter error for hotel ${hotelId}:`, error);
      return {
        allowed: true,
        remaining: this.LIMIT,
      };
    }
  }

  /**
   * Get remaining requests for a hotel
   */
  async getRemaining(hotelId: string): Promise<number> {
    try {
      const key = `${this.KEY_PREFIX}:${hotelId}`;
      const count = await this.redis.get(key);
      if (!count) return this.LIMIT;
      return Math.max(0, this.LIMIT - parseInt(count, 10));
    } catch (error) {
      console.error(`Error getting remaining for ${hotelId}:`, error);
      return this.LIMIT;
    }
  }

  /**
   * Reset rate limit for a hotel (manual override)
   */
  async reset(hotelId: string): Promise<void> {
    try {
      const key = `${this.KEY_PREFIX}:${hotelId}`;
      await this.redis.del(key);
    } catch (error) {
      console.error(`Error resetting for ${hotelId}:`, error);
    }
  }

  /**
   * Get current status for a hotel (debugging)
   */
  async getStatus(hotelId: string): Promise<{
    count: number;
    remaining: number;
    ttl: number;
    limit: number;
    window: number;
  }> {
    try {
      const key = `${this.KEY_PREFIX}:${hotelId}`;
      const [count, ttl] = await Promise.all([
        this.redis.get(key),
        this.redis.ttl(key),
      ]);

      const countNum = count ? parseInt(count, 10) : 0;

      return {
        count: countNum,
        remaining: Math.max(0, this.LIMIT - countNum),
        ttl: ttl > 0 ? ttl : 0,
        limit: this.LIMIT,
        window: this.WINDOW,
      };
    } catch (error) {
      console.error(`Error getting status for ${hotelId}:`, error);
      return {
        count: 0,
        remaining: this.LIMIT,
        ttl: 0,
        limit: this.LIMIT,
        window: this.WINDOW,
      };
    }
  }
}
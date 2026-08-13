import { Controller, Get, Param } from '@nestjs/common';
import { RateLimiterService } from 'src/rate-limiter/rate-limiter.service';

@Controller('debug')
export class DebugController {
  constructor(private readonly rateLimiter: RateLimiterService) {}

  @Get('rate-limit/:hotelId')
  async getRateLimitStatus(@Param('hotelId') hotelId: string) {
    return await this.rateLimiter.getStatus(hotelId);
  }

  @Get('rate-limit/:hotelId/reset')
  async resetRateLimit(@Param('hotelId') hotelId: string) {
    await this.rateLimiter.reset(hotelId);
    return { success: true, message: `Rate limit reset for ${hotelId}` };
  }
}
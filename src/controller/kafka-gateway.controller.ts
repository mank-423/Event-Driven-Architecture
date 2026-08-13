import { Controller, Post, Body, HttpCode, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InternalRatePushPayloadDto } from '../aiosell/dto/internal-rate.dto';
import { InternalInventoryPushDto } from '../aiosell/dto/internal-inventory.dto';
import { 
  InternalInventoryRestrictionPushDto, 
  InternalRateRestrictionPushDto 
} from '../aiosell/dto/internal-restrictions.dto';
import { InternalNoShowDto } from '../aiosell/dto/internal-noshow.dto';
import { RateLimiterService } from 'src/rate-limiter/rate-limiter.service';

@Controller('kafka')  // Endpoint: /kafka
export class KafkaGatewayController {
  constructor(
    @Inject('KAFKA_SERVICE') 
    private readonly kafkaClient: ClientKafka,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  /**
   * POST /kafka/push-rates
   * PMS calls this to push rate updates via Kafka
   */
  @Post('push-rates')
  @HttpCode(202)  // 202 Accepted - async processing
  async pushRates(@Body() payload: InternalRatePushPayloadDto) {

    const { remaining } = await this.rateLimiter.checkAndIncrement(payload.hotelId);

    // Publish to Kafka topic 'rate-updates'
    await this.kafkaClient.emit('rate-updates', {
      key: payload.hotelId,
      value: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Rate update queued for processing',
      hotelId: payload.hotelId,
      status: 'queued',
      remaining,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /kafka/push-inventory
   * PMS calls this to push inventory updates via Kafka
   */
  @Post('push-inventory')
  @HttpCode(202)
  async pushInventory(@Body() payload: InternalInventoryPushDto) {

    const { remaining } = await this.rateLimiter.checkAndIncrement(payload.hotelId);

    await this.kafkaClient.emit('inventory-updates', {
      key: payload.hotelId,
      value: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Inventory update queued for processing',
      hotelId: payload.hotelId,
      status: 'queued',
      remaining,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /kafka/push-inventory-restrictions
   * PMS calls this to push inventory restrictions via Kafka
   */
  @Post('push-inventory-restrictions')
  @HttpCode(202)
  async pushInventoryRestrictions(@Body() payload: InternalInventoryRestrictionPushDto) {

    const { remaining } = await this.rateLimiter.checkAndIncrement(payload.hotelId);

    await this.kafkaClient.emit('inventory-restrictions', {
      key: payload.hotelId,
      value: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Inventory restrictions queued for processing',
      hotelId: payload.hotelId,
      status: 'queued',
      remaining,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /kafka/push-rate-restrictions
   * PMS calls this to push rate restrictions via Kafka
   */
  @Post('push-rate-restrictions')
  @HttpCode(202)
  async pushRateRestrictions(@Body() payload: InternalRateRestrictionPushDto) {

    const { remaining } = await this.rateLimiter.checkAndIncrement(payload.hotelId);

    await this.kafkaClient.emit('rate-restrictions', {
      key: payload.hotelId,
      value: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Rate restrictions queued for processing',
      hotelId: payload.hotelId,
      status: 'queued',
      remaining,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /kafka/push-noshow
   * PMS calls this to push no-show updates via Kafka
   */
  @Post('push-noshow')
  @HttpCode(202)
  async pushNoShow(@Body() payload: InternalNoShowDto) {

    const { remaining } = await this.rateLimiter.checkAndIncrement(payload.hotelId);

    await this.kafkaClient.emit('noshow-updates', {
      key: payload.hotelId,
      value: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'No-show update queued for processing',
      hotelId: payload.hotelId,
      bookingId: payload.bookingId,
      status: 'queued',
      remaining,
      timestamp: new Date().toISOString(),
    };
  }
}
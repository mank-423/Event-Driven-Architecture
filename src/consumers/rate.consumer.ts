// consumers/rate.consumer.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { AiosellAdapterService } from '../aiosell/services/aiosell-adapter.service';
import { InternalRatePushPayloadDto } from '../aiosell/dto/internal-rate.dto';

@Controller()
export class RateConsumer {
  constructor(
    private readonly aiosellService: AiosellAdapterService,
  ) {}

  @EventPattern('rate-updates')
  async handleRateUpdate(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    try {
      // NestJS @Payload() automatically strips the outer Kafka frame. 
      // If it's already an object, use it directly. If it's a string/Buffer, parse it.
      let payload: InternalRatePushPayloadDto;
      
      if (typeof message === 'object' && message !== null && !Buffer.isBuffer(message)) {
        payload = message;
      } else {
        const rawString = Buffer.isBuffer(message) ? message.toString() : message;
        payload = JSON.parse(rawString);
      }
      
      console.log(`📥 Received rate update for hotel: ${payload.hotelId}`);
      console.log(`📦 Batch size: ${payload.updates.length} date ranges`);

      const result = await this.aiosellService.pushRates(payload);
      
      console.log(`Successfully pushed rates to Aiosell`);
      return result;
    } catch (error: any) {
      console.error(`Failed to process rate update message: ${error.message}`);
      // Throwing allows Kafka to retry or dead-letter depending on configuration
      throw error;
    }
  }
}
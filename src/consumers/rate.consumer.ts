import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { AiosellAdapterService } from '../aiosell/services/aiosell-adapter.service';
import { InternalRatePushPayloadDto } from '../aiosell/dto/internal-rate.dto';

@Controller()
export class RateConsumer {
  constructor(private readonly aiosellService: AiosellAdapterService) {}

  @EventPattern('rate-updates')
  async handleRateUpdate(@Payload() message: any, @Ctx() context: KafkaContext) {
    try {
      // Parse the message - handles both string and object formats
      let payload: InternalRatePushPayloadDto;
      if (typeof message === 'object' && message !== null && !Buffer.isBuffer(message)) {
        payload = message;
      } else {
        const rawString = Buffer.isBuffer(message) ? message.toString() : message;
        payload = JSON.parse(rawString);
      }

      console.log(`[RateConsumer] Received rate update for hotel: ${payload.hotelId}`);
      console.log(`[RateConsumer] Batch size: ${payload.updates.length} date ranges`);

      // Call the SAME service that TestController uses
      const result = await this.aiosellService.pushRates(payload);

      console.log(`[RateConsumer] Successfully pushed rates to Aiosell`);
      return result; // Success → commits offset
    } catch (error: any) {
      console.error(`[RateConsumer] Failed to process rate update: ${error.message}`);
      throw error; // Throws → does NOT commit offset → retries
    }
  }
}
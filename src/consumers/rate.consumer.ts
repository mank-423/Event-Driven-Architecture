import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { providerAdapterService } from '../provider/services/provider-adapter.service';
import { InternalRatePushPayloadDto } from '../provider/dto/internal-rate.dto';

@Controller()
export class RateConsumer {
  constructor(private readonly providerService: providerAdapterService) {}

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
      const result = await this.providerService.pushRates(payload);

      console.log(`[RateConsumer] Successfully pushed rates to provider`);
      return result; // Success → commits offset
    } catch (error: any) {
      console.error(`[RateConsumer] Failed to process rate update: ${error.message}`);
      throw error; // Throws → does NOT commit offset → retries
    }
  }
}
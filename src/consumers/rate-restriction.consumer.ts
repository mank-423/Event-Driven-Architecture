import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { AiosellAdapterService } from '../aiosell/services/aiosell-adapter.service';
import { InternalRateRestrictionPushDto } from '../aiosell/dto/internal-restrictions.dto';

@Controller()
export class RateRestrictionConsumer {
  constructor(private readonly aiosellService: AiosellAdapterService) {}

  @EventPattern('rate-restrictions')
  async handleRateRestriction(@Payload() message: any, @Ctx() context: KafkaContext) {
    try {
      let payload: InternalRateRestrictionPushDto;
      if (typeof message === 'object' && message !== null && !Buffer.isBuffer(message)) {
        payload = message;
      } else {
        const rawString = Buffer.isBuffer(message) ? message.toString() : message;
        payload = JSON.parse(rawString);
      }

      console.log(`[RateRestrictionConsumer] Received rate restriction for hotel: ${payload.hotelId}`);
      console.log(`[RateRestrictionConsumer] Channels: ${payload.toChannels.join(', ')}`);

      const result = await this.aiosellService.pushRateRestrictions(payload);

      console.log(`[RateRestrictionConsumer] Successfully pushed rate restrictions to Aiosell`);
      return result;
    } catch (error: any) {
      console.error(`[RateRestrictionConsumer] Failed to process rate restrictions: ${error.message}`);
      throw error;
    }
  }
}
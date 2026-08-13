import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { providerAdapterService } from '../provider/services/provider-adapter.service';
import { InternalRateRestrictionPushDto } from '../provider/dto/internal-restrictions.dto';

@Controller()
export class RateRestrictionConsumer {
  constructor(private readonly providerService: providerAdapterService) {}

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

      const result = await this.providerService.pushRateRestrictions(payload);

      console.log(`[RateRestrictionConsumer] Successfully pushed rate restrictions to provider`);
      return result;
    } catch (error: any) {
      console.error(`[RateRestrictionConsumer] Failed to process rate restrictions: ${error.message}`);
      throw error;
    }
  }
}
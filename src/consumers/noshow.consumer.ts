import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { providerAdapterService } from '../provider/services/provider-adapter.service';
import { InternalNoShowDto } from '../provider/dto/internal-noshow.dto';

@Controller()
export class NoShowConsumer {
  constructor(private readonly providerService: providerAdapterService) {}

  @EventPattern('noshow-updates')
  async handleNoShow(@Payload() message: any, @Ctx() context: KafkaContext) {
    try {
      let payload: InternalNoShowDto;
      if (typeof message === 'object' && message !== null && !Buffer.isBuffer(message)) {
        payload = message;
      } else {
        const rawString = Buffer.isBuffer(message) ? message.toString() : message;
        payload = JSON.parse(rawString);
      }

      console.log(`[NoShowConsumer] Received no-show for booking: ${payload.bookingId}`);
      console.log(`[NoShowConsumer] Hotel: ${payload.hotelId}, Partner: ${payload.partner}`);

      const result = await this.providerService.pushNoShow(payload);

      console.log(`[NoShowConsumer] Successfully pushed no-show to provider`);
      return result;
    } catch (error: any) {
      console.error(`[NoShowConsumer] Failed to process no-show: ${error.message}`);
      throw error;
    }
  }
}
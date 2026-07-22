import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { AiosellAdapterService } from '../aiosell/services/aiosell-adapter.service';
import { InternalNoShowDto } from '../aiosell/dto/internal-noshow.dto';

@Controller()
export class NoShowConsumer {
  constructor(private readonly aiosellService: AiosellAdapterService) {}

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

      const result = await this.aiosellService.pushNoShow(payload);

      console.log(`[NoShowConsumer] Successfully pushed no-show to Aiosell`);
      return result;
    } catch (error: any) {
      console.error(`[NoShowConsumer] Failed to process no-show: ${error.message}`);
      throw error;
    }
  }
}
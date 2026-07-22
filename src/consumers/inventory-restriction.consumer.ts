import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { AiosellAdapterService } from '../aiosell/services/aiosell-adapter.service';
import { InternalInventoryRestrictionPushDto } from '../aiosell/dto/internal-restrictions.dto';

@Controller()
export class InventoryRestrictionConsumer {
  constructor(private readonly aiosellService: AiosellAdapterService) {}

  @EventPattern('inventory-restrictions')
  async handleInventoryRestriction(@Payload() message: any, @Ctx() context: KafkaContext) {
    try {
      let payload: InternalInventoryRestrictionPushDto;
      if (typeof message === 'object' && message !== null && !Buffer.isBuffer(message)) {
        payload = message;
      } else {
        const rawString = Buffer.isBuffer(message) ? message.toString() : message;
        payload = JSON.parse(rawString);
      }

      console.log(`[InventoryRestrictionConsumer] Received restriction for hotel: ${payload.hotelId}`);
      console.log(`[InventoryRestrictionConsumer] Channels: ${payload.toChannels.join(', ')}`);

      const result = await this.aiosellService.pushInventoryRestrictions(payload);

      console.log(`[InventoryRestrictionConsumer] Successfully pushed restrictions to Aiosell`);
      return result;
    } catch (error: any) {
      console.error(`[InventoryRestrictionConsumer] Failed to process restrictions: ${error.message}`);
      throw error;
    }
  }
}
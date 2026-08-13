import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { providerAdapterService } from '../provider/services/provider-adapter.service';
import { InternalInventoryRestrictionPushDto } from '../provider/dto/internal-restrictions.dto';

@Controller()
export class InventoryRestrictionConsumer {
  constructor(private readonly providerService: providerAdapterService) {}

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

      const result = await this.providerService.pushInventoryRestrictions(payload);

      console.log(`[InventoryRestrictionConsumer] Successfully pushed restrictions to provider`);
      return result;
    } catch (error: any) {
      console.error(`[InventoryRestrictionConsumer] Failed to process restrictions: ${error.message}`);
      throw error;
    }
  }
}
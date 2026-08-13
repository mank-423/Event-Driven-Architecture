import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { providerAdapterService } from '../provider/services/provider-adapter.service';
import { InternalInventoryPushDto } from '../provider/dto/internal-inventory.dto';

@Controller()
export class InventoryConsumer {
  constructor(private readonly providerService: providerAdapterService) {}

  @EventPattern('inventory-updates')
  async handleInventoryUpdate(@Payload() message: any, @Ctx() context: KafkaContext) {
    try {
      let payload: InternalInventoryPushDto;
      if (typeof message === 'object' && message !== null && !Buffer.isBuffer(message)) {
        payload = message;
      } else {
        const rawString = Buffer.isBuffer(message) ? message.toString() : message;
        payload = JSON.parse(rawString);
      }

      console.log(`📥 [InventoryConsumer] Received inventory update for hotel: ${payload.hotelId}`);
      console.log(`📦 [InventoryConsumer] Batch size: ${payload.updates.length} date ranges`);

      const result = await this.providerService.pushInventory(payload);

      console.log(`✅ [InventoryConsumer] Successfully pushed inventory to provider`);
      return result;
    } catch (error: any) {
      console.error(`❌ [InventoryConsumer] Failed to process inventory: ${error.message}`);
      throw error;
    }
  }
}
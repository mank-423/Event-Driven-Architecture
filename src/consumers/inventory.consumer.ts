import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { AiosellAdapterService } from '../aiosell/services/aiosell-adapter.service';
import { InternalInventoryPushDto } from '../aiosell/dto/internal-inventory.dto';

@Controller()
export class InventoryConsumer {
  constructor(private readonly aiosellService: AiosellAdapterService) {}

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

      const result = await this.aiosellService.pushInventory(payload);

      console.log(`✅ [InventoryConsumer] Successfully pushed inventory to Aiosell`);
      return result;
    } catch (error: any) {
      console.error(`❌ [InventoryConsumer] Failed to process inventory: ${error.message}`);
      throw error;
    }
  }
}
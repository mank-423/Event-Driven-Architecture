import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { AiosellModule } from './aiosell/aiosell.module';
import { AppController, TestController } from './controller/api.controller';
import { getKafkaConfig } from './config/kafka.config'; // 👈 Import helper

// Import all Kafka consumers
import { RateConsumer } from './consumers/rate.consumer';
import { NoShowConsumer } from './consumers/noshow.consumer';
import { RateRestrictionConsumer } from './consumers/rate-restriction.consumer';
import { InventoryRestrictionConsumer } from './consumers/inventory-restriction.consumer';
import { InventoryConsumer } from './consumers/inventory.consumer';
import { KafkaGatewayController } from './controller/kafka-gateway.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Use registerAsync so process.env values are read before configuring the client
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        useFactory: () => getKafkaConfig(),
      },
    ]),
    AiosellModule,
  ],
  controllers: [
    AppController,
    TestController,
    KafkaGatewayController,
    RateConsumer,
    InventoryConsumer,
    InventoryRestrictionConsumer,
    RateRestrictionConsumer,
    NoShowConsumer,
  ],
  providers: [],
})
export class AppModule {}
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AiosellModule } from './aiosell/aiosell.module';
import { TestController } from './test-controller/test.controller';
import { RateConsumer } from './consumers/rate.consumer'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'aiosell-adapter',
            brokers: ['localhost:9092'], // Local Kafka
            // When deploying to AWS MSK, change this to:
            // brokers: ['b-1.msk-cluster.aws.com:9092', 'b-2.msk-cluster.aws.com:9092'],
          },
          consumer: {
            groupId: 'aiosell-adapter-group', // All instances share this group ID
            maxBatchSize: 500,                 // Max messages per batch
            maxWaitTimeInMs: 1000,             // Wait 1s for batch to fill
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
    AiosellModule,
  ],
  controllers: [TestController, RateConsumer], // Add RateConsumer here
  providers: [],
})
export class AppModule {}
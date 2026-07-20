// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Connect Kafka as a Microservice (Hybrid App setup)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'aiosell-adapter',
        brokers: ['localhost:9092'], // Matches docker container exposed port
        retry: {
          retries: 2,
          restartOnFailure: async (error) => {
            console.error('Kafka broker is unavailable. Retrying in background...');
            return true; // Keeps trying without throwing a fatal crash error
          }
        }
      },
      consumer: {
        groupId: 'aiosell-adapter-group',
      },
    },
  });

  // 2. Start the Kafka microservice listeners
  app.startAllMicroservices().catch((err: any) => {
    console.warn('Kafka microservice failed to start:', err);
    console.warn('HTTP API working correctly');
  });

  // 3. Start the traditional HTTP REST API server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Traditional HTTP API is running on: http://localhost:${port}`);
  console.log(`Kafka Consumer microservice has started listening to topics`);
}

bootstrap();
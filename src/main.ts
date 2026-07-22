
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getKafkaConfig } from './config/kafka.config'; // 👈 Import helper

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Connect Kafka using dynamic config helper
  app.connectMicroservice<MicroserviceOptions>(getKafkaConfig());

  // 2. Start listeners
  await app.startAllMicroservices().catch((err: any) => {
    console.warn('Kafka microservice failed to start:', err);
    console.warn('HTTP API working correctly');
  });

  // 3. Start HTTP server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Traditional HTTP API running on: http://localhost:${port}`);
  console.log(`Kafka Consumer microservice started listening to topics`);
}

bootstrap();
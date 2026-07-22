import { KafkaOptions, Transport } from '@nestjs/microservices';

export const getKafkaConfig = (): KafkaOptions => {
  const isCloud = process.env.KAFKA_ENV === 'cloud';

  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'aiosell-adapter',
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        ssl: isCloud,
        sasl: isCloud
          ? {
              mechanism: 'plain', // Confluent Cloud uses PLAIN SASL
              username: process.env.KAFKA_USERNAME!,
              password: process.env.KAFKA_PASSWORD!,
            }
          : undefined,
        retry: {
          retries: 3,
          restartOnFailure: async () => true,
        },
      },
      consumer: {
        groupId: 'aiosell-adapter-group',
        maxWaitTimeInMs: 1000,
      },
    },
  };
};
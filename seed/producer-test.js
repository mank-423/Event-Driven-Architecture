const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
});

async function sendTestMessage() {
  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    idempotent: true,
  });

  await producer.connect();
  console.log('Connected to Kafka');

  const payload = {
    hotelId: 'sandbox-pms',
    updates: [
      {
        startDate: '2026-07-20',
        endDate: '2026-07-22',
        rates: [
          {
            roomId: 'executive',
            ratePlanId: 'executive-s-ep',
            price: 1749,
          },
        ],
      },
    ],
  };

  await producer.send({
    topic: 'rate-updates',
    messages: [
      {
        key: payload.hotelId, 
        value: JSON.stringify(payload),
      },
    ],
  });

  console.log('Sent message to Kafka:');
  console.log(JSON.stringify(payload, null, 2));

  await producer.disconnect();
  console.log('Disconnected from Kafka');
}

sendTestMessage().catch(console.error);
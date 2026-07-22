// seed/producer-test.js
const { Kafka, Partitioners } = require('kafkajs');

process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10,
    maxRetryTime: 30000,
  },
});

async function sendMessage(topic, payload) {
  const producer = kafka.producer({
    allowAutoTopicCreation: false,
    createPartitioner: Partitioners.LegacyPartitioner,
    idempotent: true,
  });

  try {
    await producer.connect();
    console.log(`Connected to Kafka`);

    const result = await producer.send({
      topic: topic,
      messages: [
        {
          key: payload.hotelId || payload.hotelId,
          value: JSON.stringify(payload),
        },
      ],
    });

    console.log(`Sent message to topic: ${topic}`);
    console.log(`Partition: ${result[0].partition}, Offset: ${result[0].offset}`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error(`Failed to send message:`, error.message);
  } finally {
    await producer.disconnect();
    console.log(`🔌 Disconnected from Kafka`);
  }
}

// Test payloads for each topic
const ratePayload = {
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

const inventoryPayload = {
  hotelId: 'sandbox-pms',
  updates: [
    {
      startDate: '2026-07-20',
      endDate: '2026-07-22',
      rooms: [
        {
          roomId: 'executive',
          available: 5,
        },
      ],
    },
  ],
};

const restrictionPayload = {
  hotelId: 'sandbox-pms',
  toChannels: ['agoda', 'booking.com'],
  updates: [
    {
      startDate: '2026-07-20',
      endDate: '2026-07-22',
      rooms: [
        {
          roomId: 'executive',
          restrictions: {
            stopSell: false,
            minimumStay: 2,
            maximumStay: null,
          },
        },
      ],
    },
  ],
};

const noShowPayload = {
  hotelId: 'sandbox-pms',
  bookingId: 'GOIBIBO0001',
  partner: 'booking.com',
};

// Run all tests
async function runTests() {
  console.log('\n Testing Rate Updates...');
  await sendMessage('rate-updates', ratePayload);

  console.log('\n Testing Inventory Updates...');
  await sendMessage('inventory-updates', inventoryPayload);

  console.log('\n Testing Restrictions...');
  await sendMessage('inventory-restrictions', restrictionPayload);

  console.log('\n Testing No-Show...');
  await sendMessage('noshow-updates', noShowPayload);
}

runTests().catch(console.error);
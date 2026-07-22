const { Kafka } = require('kafkajs');

process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: 'admin-client',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10,
    maxRetryTime: 30000,
  },
});

const topics = [
  {
    topic: 'rate-updates',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '259200000' }, // 72 hours
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
  {
    topic: 'inventory-updates',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '259200000' },
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
  {
    topic: 'inventory-restrictions',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '259200000' },
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
  {
    topic: 'rate-restrictions',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '259200000' },
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
  {
    topic: 'noshow-updates',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '604800000' }, // 7 days
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
  {
    topic: 'reservation-received',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '604800000' }, // 7 days for reservations
      { name: 'cleanup.policy', value: 'delete' },
    ],
  },
];

async function createTopics() {
  const admin = kafka.admin();
  
  try {
    await admin.connect();
    console.log('Connected to Kafka Admin');

    // Check existing topics
    const existingTopics = await admin.listTopics();
    console.log(`Existing topics (${existingTopics.length}):`, existingTopics.join(', '));

    // Filter out topics that already exist
    const topicsToCreate = topics.filter(
      (t) => !existingTopics.includes(t.topic)
    );

    if (topicsToCreate.length === 0) {
      console.log('All topics already exist!');
      return;
    }

    console.log(`Creating ${topicsToCreate.length} topics...`);
    console.log('Topics:', topicsToCreate.map(t => t.topic).join(', '));
    
    const result = await admin.createTopics({
      topics: topicsToCreate,
      waitForLeaders: true,
      timeout: 30000,
    });

    if (result) {
      console.log(' Topics created successfully!');
      
      // Verify topics were created
      const newTopics = await admin.listTopics();
      console.log(`Updated topics (${newTopics.length}):`, newTopics.join(', '));
    } else {
      console.warn('Some topics may already exist or creation failed');
    }
  } catch (error) {
    console.error('Failed to create topics:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause.message);
    }
  } finally {
    await admin.disconnect();
    console.log('Disconnected from Kafka Admin');
  }
}

// Run with retries
async function runWithRetry() {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n Attempt ${attempts}/${maxAttempts} to create topics...`);
    
    try {
      await createTopics();
      // If we get here, it succeeded
      console.log('\n Topic creation completed successfully!');
      return;
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error.message);
      
      if (attempts < maxAttempts) {
        console.log(`Waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  console.error('\n All attempts failed. Please check:');
  console.error('1. Is Kafka running? (docker ps | grep kafka)');
  console.error('2. Is Kafka healthy? (docker logs local-kafka --tail 20)');
  console.error('3. Can you connect to localhost:9092?');
  process.exit(1);
}

runWithRetry();
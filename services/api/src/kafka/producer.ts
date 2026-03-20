import { Kafka, Producer, logLevel } from 'kafkajs';
import { logger } from '../utils/logger';

const brokers = (process.env.KAFKA_BROKERS || '').split(',').filter(Boolean);

// Skip Kafka entirely if no brokers configured
const kafkaEnabled = brokers.length > 0 && brokers[0] !== '' && brokers[0] !== 'localhost:9092';

const kafka = kafkaEnabled ? new Kafka({
  clientId: 'fraud-shield-api',
  brokers,
  logLevel: logLevel.ERROR,
  retry: { retries: 1 }, // Fail fast — don't retry 5 times
}) : null;

let producer: Producer | null = null;

export async function initKafka(): Promise<void> {
  if (!kafka) {
    logger.info('Kafka disabled — no brokers configured');
    return;
  }
  producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });
  await producer.connect();
}

/** Returns true when the Kafka producer is connected and ready. */
export function isKafkaOnline(): boolean {
  return producer !== null;
}

export async function publishToKafka(
  topic: string,
  key: string,
  value: object
): Promise<void> {
  if (!producer) {
    logger.warn('Kafka offline — message dropped', { topic, key });
    return;
  }
  await producer.send({
    topic,
    messages: [{ key, value: JSON.stringify(value), timestamp: String(Date.now()) }],
  });
  logger.debug('Published to Kafka', { topic, key });
}

export async function shutdownKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  }
}

process.on('SIGTERM', async () => {
  await shutdownKafka();
  process.exit(0);
});

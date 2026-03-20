import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

// Railway provides DATABASE_URL automatically
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/**
 * Execute a parameterized query.
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Get a client from the pool for transactions.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Run a function inside a database transaction.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Initialize the database — run migration.
 */
export async function initDatabase(): Promise<void> {
  try {
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connected');
  } catch (err) {
    logger.warn('PostgreSQL unavailable — API key management will use fallback', { err });
  }
}

export { pool };

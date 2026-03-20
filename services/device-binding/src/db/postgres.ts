/**
 * PostgreSQL connection pool for device-binding-service.
 * All queries are parameterised — no raw string interpolation.
 */
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host:     process.env.POSTGRES_HOST     || 'localhost',
  port:     parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB       || 'payguard',
  user:     process.env.POSTGRES_USER     || 'payguard',
  password: process.env.POSTGRES_PASSWORD || 'payguard_secret',
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: true } : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

/** Execute a single parameterised query. */
export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    console.warn(`[DB] Slow query (${duration}ms): ${text.substring(0, 80)}`);
  }
  return res.rows as T[];
}

/** Run a function inside a transaction — auto rollback on error. */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
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

export default pool;

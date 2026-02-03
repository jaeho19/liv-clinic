import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

export default function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    _sql = postgres(url, {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    });
  }
  return _sql;
}

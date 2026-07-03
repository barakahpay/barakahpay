import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '@/config.js';
import * as schema from './schema.js';

function resolveFilePath(url: string): string | null {
  if (url.startsWith('file:')) return url.slice(5);
  if (!url.includes('://')) return url;
  return null;
}

const filePath = resolveFilePath(config.DATABASE_URL);
if (filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

export const client = createClient({
  url: config.DATABASE_URL.startsWith('file:')
    ? config.DATABASE_URL
    : filePath
      ? `file:${filePath}`
      : config.DATABASE_URL,
});

export const db: LibSQLDatabase<typeof schema> = drizzle(client, { schema });
export { schema };

// Convenience for the health check
export async function pingDb(): Promise<boolean> {
  try {
    await client.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

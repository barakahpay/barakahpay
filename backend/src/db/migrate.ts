import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, client } from './client.js';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  client.close();
  console.log('Migrations complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionUrl =
  process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();

function buildDbCredentials() {
  if (connectionUrl) {
    return { url: connectionUrl };
  }

  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

  if (!sqlHost || !sqlDbName || !user || !password) {
    throw new Error(
      'Set DATABASE_URL (for Vercel/Neon/Supabase) or SQL_HOST/SQL_DB_NAME/SQL_ADMIN_USER/SQL_ADMIN_PASSWORD.'
    );
  }

  return {
    host: sqlHost,
    user,
    password,
    database: sqlDbName,
    ssl: false as const,
  };
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: buildDbCredentials(),
  verbose: true,
});

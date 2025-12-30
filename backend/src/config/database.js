import pkg from '@prisma/client';
const { PrismaClient } = pkg;
//const prisma = new PrismaClient();
//export default prisma;
//import { PrismaClient } from '@prisma/client/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables - ensure .env is loaded from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up from src/config to backend root
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Get the original DATABASE_URL string (keep the "file:" prefix)
// The adapter expects a config object with a 'url' property
const databaseUrlString = process.env.DATABASE_URL || 'file:./dev.db';

// Resolve relative paths to absolute paths for the URL
let resolvedUrl = databaseUrlString;
if (databaseUrlString.startsWith('file:./') || databaseUrlString.startsWith('file:../')) {
  const filePath = databaseUrlString.replace(/^file:/, '');
  const absolutePath = resolve(__dirname, '../../', filePath);
  resolvedUrl = `file:${absolutePath}`;
}

// Create adapter - pass config object with 'url' property
// The adapter will create the Database instance internally
const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;


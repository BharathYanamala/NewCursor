// prisma.config.js
import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // This pulls the connection string from your .env file
    url: process.env.DATABASE_URL,
  },
});
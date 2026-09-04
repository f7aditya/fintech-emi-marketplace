import { PrismaClient } from '@prisma/client';

// A single shared Prisma client for the process.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});

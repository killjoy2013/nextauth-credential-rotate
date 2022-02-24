import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query'],
  });
new PrismaClient();
new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

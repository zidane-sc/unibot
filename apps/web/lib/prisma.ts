import { PrismaClient } from '@prisma/client';

const globalInstance = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalInstance.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalInstance.prisma = prisma;
}

export default prisma;

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  // 1. Create a native Postgres connection pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // 2. Wrap it in the new Prisma 7 Adapter
  const adapter = new PrismaPg(pool);

  // 3. Pass the adapter into the client constructor!
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

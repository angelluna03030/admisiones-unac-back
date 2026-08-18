import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
/// por nada del mundo no cambiarle el nombre de cliente
/// aveces funcion con el archivo cliente.js o otras veces con index.js
import { PrismaClient } from '../../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

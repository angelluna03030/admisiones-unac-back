import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js'; // Ajusta la ruta si es necesario
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Configuramos el adaptador de PostgreSQL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// 2. Exportamos una ÚNICA instancia (Singleton) que ya incluye el adaptador
export const prisma = new PrismaClient({
  adapter,
  // Opcional: descomenta para ver las consultas en consola durante el desarrollo
  // log: ['query', 'info', 'warn', 'error'],
});

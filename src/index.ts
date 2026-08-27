import { app } from './app';

const PORT = process.env.PORT || 3000;

// Manejo de cierre graceful para Prisma
process.on('SIGINT', async () => {
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

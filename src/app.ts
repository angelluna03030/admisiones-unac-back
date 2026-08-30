import express from 'express';
import cors from 'cors'; // <-- 1. Importar cors
import { programaRoutes } from './routes/programa.routes';
import { aspiranteRoutes } from './routes/aspirante.routes';
import { usuarioRoutes } from './routes/usuario.routes';

export const app = express();

// 2. Configurar CORS (¡DEBE IR ANTES de express.json() y de las rutas!)
app.use(
  cors({
    origin: 'http://localhost:5173', // El puerto de tu frontend (Vite)
    credentials: true, // Permite enviar cookies/credenciales si las usas
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// 3. Middlewares de parseo de datos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Servidor de Admisiones corriendo' });
});

// 5. Rutas de la API
app.use('/api/programas', programaRoutes);
app.use('/aspirantes', aspiranteRoutes); // <-- Agrega esta línea
app.use('/api/usuarios', usuarioRoutes);
// ⚠️ NOTA: Fíjate que aquí puse '/api/programas'.
// Si tu frontend llama a 'http://localhost:3000/programas' (sin /api),
// cambia esta línea a: app.use('/programas', programaRoutes);

// 6. Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});
